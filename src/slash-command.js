(function () {
  'use strict';

  /**
   * SlashCommand — floating widget-insert palette triggered by typing '/' in Quill.
   *
   * Usage (after Quill and WidgetRegistry are ready):
   *   new SlashCommand(quill);
   */
  function SlashCommand(quill) {
    this._quill         = quill;
    this._palette       = null;   // DOM node, created lazily
    this._isOpen        = false;
    this._triggerIndex  = -1;     // Quill doc index of the '/' char
    this._query         = '';     // text typed after '/'
    this._selectedIndex = 0;
    this._currentItems  = [];

    this._onTextChange      = this._onTextChange.bind(this);
    this._onSelectionChange = this._onSelectionChange.bind(this);
    this._onKeydown         = this._onKeydown.bind(this);

    quill.on('text-change',      this._onTextChange);
    quill.on('selection-change', this._onSelectionChange);
  }

  // ── Quill event handlers ───────────────────────────────────────────────────

  SlashCommand.prototype._onTextChange = function (delta, oldDelta, source) {
    if (source !== 'user') return;

    if (!this._isOpen) {
      // Use the delta to find the insert position — getSelection() returns
      // the pre-insert index during text-change and is not reliable here.
      var info = this._getInsertInfo(delta);
      if (info && info.text === '/') {
        this._open(info.index);
      }
      return;
    }

    this._updateFromDocument();
  };

  // Returns { index, text } for the first insert op in a delta, or null.
  SlashCommand.prototype._getInsertInfo = function (delta) {
    var offset = 0;
    var ops = (delta && delta.ops) || [];
    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      if (typeof op.retain === 'number') {
        offset += op.retain;
      } else if (typeof op.insert === 'string') {
        return { index: offset, text: op.insert };
      } else {
        return null;
      }
    }
    return null;
  };

  SlashCommand.prototype._onSelectionChange = function (range) {
    if (!this._isOpen) return;
    // Cursor left the editor or moved before the trigger — close
    if (!range || range.index < this._triggerIndex + 1) {
      this._close();
    }
  };

  // ── Keyboard trap (attached/detached dynamically while palette is open) ───

  SlashCommand.prototype._onKeydown = function (e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        this._moveSelection(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        this._moveSelection(-1);
        break;
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        this._insertSelected();
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        this._close();
        break;
    }
  };

  // ── Open / close ───────────────────────────────────────────────────────────

  SlashCommand.prototype._open = function (triggerIndex) {
    this._triggerIndex  = triggerIndex;
    this._query         = '';
    this._selectedIndex = 0;
    this._isOpen        = true;

    if (!this._palette) {
      this._palette = this._buildPalette();
      document.body.appendChild(this._palette);
    }

    this._currentItems = WidgetRegistry.getVisible();
    this._renderItems(this._currentItems);
    this._palette.classList.add('is-open');
    this._position();

    // Intercept keys before Quill's keyboard module sees them
    document.addEventListener('keydown', this._onKeydown, true);
  };

  SlashCommand.prototype._close = function () {
    if (!this._isOpen) return;
    this._isOpen = false;
    if (this._palette) {
      this._palette.classList.remove('is-open');
    }
    document.removeEventListener('keydown', this._onKeydown, true);
  };

  // ── Query update (called on every text-change while open) ─────────────────

  SlashCommand.prototype._updateFromDocument = function () {
    var sel          = this._quill.getSelection();
    var currentIndex = sel ? sel.index : 0;

    if (currentIndex <= this._triggerIndex) {
      this._close();
      return;
    }

    // Close if the '/' character was deleted
    var triggerChar = this._quill.getText(this._triggerIndex, 1);
    if (triggerChar !== '/') {
      this._close();
      return;
    }

    var queryLen   = currentIndex - this._triggerIndex - 1;
    this._query    = queryLen > 0 ? this._quill.getText(this._triggerIndex + 1, queryLen) : '';

    var filtered        = this._filterWidgets(this._query);
    this._selectedIndex = 0;
    this._currentItems  = filtered;
    this._renderItems(filtered);
  };

  // ── Filtering ──────────────────────────────────────────────────────────────

  SlashCommand.prototype._filterWidgets = function (query) {
    var all = WidgetRegistry.getVisible();
    if (!query) return all;
    var lower = query.toLowerCase();
    return all.filter(function (W) {
      return (W.widgetLabel || '').toLowerCase().includes(lower) ||
             (W.widgetDescription || '').toLowerCase().includes(lower);
    });
  };

  // ── Insertion ─────────────────────────────────────────────────────────────

  SlashCommand.prototype._insertWidget = function (W) {
    var deleteLen = 1 + this._query.length; // '/' plus any query chars
    var index     = this._triggerIndex;

    this._close();

    this._quill.deleteText(index, deleteLen, Quill.sources.USER);
    this._quill.insertEmbed(index, W.blotName, Object.assign({}, W.defaultData || {}), Quill.sources.USER);
    this._quill.setSelection(index + 1, 0, Quill.sources.SILENT);
  };

  SlashCommand.prototype._insertSelected = function () {
    if (this._currentItems.length === 0) {
      this._close();
      return;
    }
    this._insertWidget(this._currentItems[this._selectedIndex]);
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  SlashCommand.prototype._moveSelection = function (direction) {
    if (this._currentItems.length === 0) return;

    this._selectedIndex =
      (this._selectedIndex + direction + this._currentItems.length) % this._currentItems.length;

    var items = this._palette.querySelectorAll('.slash-palette-item');
    var idx   = this._selectedIndex;
    items.forEach(function (el, i) {
      el.classList.toggle('slash-palette-item--selected', i === idx);
      el.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });

    if (items[this._selectedIndex]) {
      items[this._selectedIndex].scrollIntoView({ block: 'nearest' });
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  SlashCommand.prototype._renderItems = function (items) {
    var list = this._palette.querySelector('.slash-palette-list');
    list.innerHTML = '';

    if (items.length === 0) {
      var empty = document.createElement('div');
      empty.className   = 'slash-palette-empty';
      empty.textContent = 'No widgets match';
      list.appendChild(empty);
      return;
    }

    var self = this;
    items.forEach(function (W, i) {
      var item = document.createElement('div');
      item.className = 'slash-palette-item' +
        (i === self._selectedIndex ? ' slash-palette-item--selected' : '');
      item.setAttribute('role', 'option');
      item.setAttribute('aria-selected', i === self._selectedIndex ? 'true' : 'false');

      var icon = document.createElement('span');
      icon.className   = 'slash-palette-icon';
      icon.textContent = W.widgetIcon || '□';
      icon.setAttribute('aria-hidden', 'true');

      var info  = document.createElement('div');
      info.className = 'slash-palette-info';

      var label = document.createElement('span');
      label.className   = 'slash-palette-label';
      label.textContent = W.widgetLabel || W.blotName;

      var desc = document.createElement('span');
      desc.className   = 'slash-palette-desc';
      desc.textContent = W.widgetDescription || '';

      info.appendChild(label);
      info.appendChild(desc);
      item.appendChild(icon);
      item.appendChild(info);

      // mousedown (not click) prevents Quill from losing focus before insert
      item.addEventListener('mousedown', function (e) {
        e.preventDefault();
        self._insertWidget(W);
      });

      list.appendChild(item);
    });
  };

  // ── Positioning ───────────────────────────────────────────────────────────

  SlashCommand.prototype._position = function () {
    var editorRect = this._quill.container.getBoundingClientRect();
    var bounds     = this._quill.getBounds(this._triggerIndex);

    var left = editorRect.left + bounds.left;
    var top  = editorRect.top  + bounds.top + bounds.height + 4;

    this._palette.style.left = left + 'px';
    this._palette.style.top  = top  + 'px';

    // Clamp to viewport after the element has rendered with its final size
    var palette = this._palette;
    requestAnimationFrame(function () {
      var rect = palette.getBoundingClientRect();
      if (rect.bottom > window.innerHeight - 8) {
        palette.style.top = (editorRect.top + bounds.top - rect.height - 4) + 'px';
      }
      if (rect.right > window.innerWidth - 8) {
        palette.style.left = Math.max(8, window.innerWidth - rect.width - 8) + 'px';
      }
    });
  };

  // ── DOM construction ──────────────────────────────────────────────────────

  SlashCommand.prototype._buildPalette = function () {
    var palette = document.createElement('div');
    palette.className = 'slash-palette';
    palette.setAttribute('role', 'listbox');
    palette.setAttribute('aria-label', 'Insert widget');

    var header = document.createElement('div');
    header.className   = 'slash-palette-header';
    header.textContent = 'Widgets';

    var list = document.createElement('div');
    list.className = 'slash-palette-list';

    palette.appendChild(header);
    palette.appendChild(list);

    return palette;
  };

  // ── Init ──────────────────────────────────────────────────────────────────

  window.SlashCommand = SlashCommand;
  window.slashCommand = new SlashCommand(window.contentEditor.quill);
})();

(function () {
  'use strict';

  /**
   * ToolbarDropdown — icon button in the app header that opens a scrollable
   * widget-picker dropdown. Alternative insertion path to the slash command.
   *
   * Reads from WidgetRegistry; requires window.contentEditor.quill to exist.
   */
  function ToolbarDropdown() {
    this._button   = null;
    this._dropdown = null;
    this._isOpen   = false;

    this._onDocMousedown = this._onDocMousedown.bind(this);
    this._onDocKeydown   = this._onDocKeydown.bind(this);

    this._build();
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────

  ToolbarDropdown.prototype._build = function () {
    this._button   = this._buildButton();
    this._dropdown = this._buildDropdown();

    document.body.appendChild(this._dropdown);

    var headerActions = document.querySelector('.header-actions');
    if (headerActions) {
      headerActions.insertBefore(this._button, headerActions.firstChild);
    }
  };

  ToolbarDropdown.prototype._buildButton = function () {
    var btn = document.createElement('button');
    btn.className = 'toolbar-widget-btn';
    btn.setAttribute('aria-label', 'Insert widget');
    btn.setAttribute('title', 'Insert widget');
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');

    btn.innerHTML =
      '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" ' +
          'xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<rect x="1" y="1" width="6" height="6" rx="1" ' +
            'stroke="currentColor" stroke-width="1.25"/>' +
        '<rect x="9" y="1" width="6" height="6" rx="1" ' +
            'stroke="currentColor" stroke-width="1.25"/>' +
        '<rect x="1" y="9" width="6" height="6" rx="1" ' +
            'stroke="currentColor" stroke-width="1.25"/>' +
        '<path d="M12 9v6M9 12h6" stroke="currentColor" ' +
            'stroke-width="1.25" stroke-linecap="round"/>' +
      '</svg>';

    var self = this;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      self._toggle();
    });

    return btn;
  };

  ToolbarDropdown.prototype._buildDropdown = function () {
    var dd = document.createElement('div');
    dd.className = 'toolbar-widget-dropdown';
    dd.setAttribute('role', 'listbox');
    dd.setAttribute('aria-label', 'Widget list');

    var header = document.createElement('div');
    header.className   = 'toolbar-widget-dropdown-header';
    header.textContent = 'Widgets';

    var list = document.createElement('div');
    list.className = 'toolbar-widget-dropdown-list';

    dd.appendChild(header);
    dd.appendChild(list);

    return dd;
  };

  // ── Open / close ──────────────────────────────────────────────────────────

  ToolbarDropdown.prototype._toggle = function () {
    if (this._isOpen) {
      this._close();
    } else {
      this._open();
    }
  };

  ToolbarDropdown.prototype._open = function () {
    this._isOpen = true;
    this._button.setAttribute('aria-expanded', 'true');
    this._button.classList.add('is-active');

    this._renderItems();
    this._dropdown.classList.add('is-open');
    this._position();

    document.addEventListener('mousedown', this._onDocMousedown, true);
    document.addEventListener('keydown',   this._onDocKeydown,   true);
  };

  ToolbarDropdown.prototype._close = function () {
    if (!this._isOpen) return;
    this._isOpen = false;
    this._button.setAttribute('aria-expanded', 'false');
    this._button.classList.remove('is-active');
    this._dropdown.classList.remove('is-open');

    document.removeEventListener('mousedown', this._onDocMousedown, true);
    document.removeEventListener('keydown',   this._onDocKeydown,   true);
  };

  // ── Event handlers ────────────────────────────────────────────────────────

  ToolbarDropdown.prototype._onDocMousedown = function (e) {
    if (this._dropdown.contains(e.target) || this._button.contains(e.target)) return;
    this._close();
  };

  ToolbarDropdown.prototype._onDocKeydown = function (e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this._close();
      this._button.focus();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  ToolbarDropdown.prototype._renderItems = function () {
    var list    = this._dropdown.querySelector('.toolbar-widget-dropdown-list');
    var widgets = WidgetRegistry.getVisible();
    list.innerHTML = '';

    if (widgets.length === 0) {
      var empty = document.createElement('div');
      empty.className   = 'toolbar-widget-empty';
      empty.textContent = 'No widgets registered';
      list.appendChild(empty);
      return;
    }

    var self = this;
    widgets.forEach(function (W) {
      var item = document.createElement('div');
      item.className = 'toolbar-widget-item';
      item.setAttribute('role', 'option');

      var icon = document.createElement('span');
      icon.className   = 'toolbar-widget-item-icon';
      icon.textContent = W.widgetIcon || '□';
      icon.setAttribute('aria-hidden', 'true');

      var info = document.createElement('div');
      info.className = 'toolbar-widget-item-info';

      var label = document.createElement('span');
      label.className   = 'toolbar-widget-item-label';
      label.textContent = W.widgetLabel || W.blotName;

      var desc = document.createElement('span');
      desc.className   = 'toolbar-widget-item-desc';
      desc.textContent = W.widgetDescription || '';

      info.appendChild(label);
      info.appendChild(desc);
      item.appendChild(icon);
      item.appendChild(info);

      // mousedown (not click) keeps Quill focus state intact
      item.addEventListener('mousedown', function (e) {
        e.preventDefault();
        self._insertWidget(W);
      });

      list.appendChild(item);
    });
  };

  // ── Insertion ─────────────────────────────────────────────────────────────

  ToolbarDropdown.prototype._insertWidget = function (W) {
    this._close();

    var quill = window.contentEditor.quill;
    quill.focus();
    var sel   = quill.getSelection(true);
    var index = sel ? sel.index : quill.getLength() - 1;

    quill.insertEmbed(
      index,
      W.blotName,
      Object.assign({}, W.defaultData || {}),
      Quill.sources.USER
    );
    quill.setSelection(index + 1, 0, Quill.sources.SILENT);
  };

  // ── Positioning ───────────────────────────────────────────────────────────

  ToolbarDropdown.prototype._position = function () {
    var btnRect = this._button.getBoundingClientRect();
    var dd      = this._dropdown;

    dd.style.top   = (btnRect.bottom + 4) + 'px';
    dd.style.right = (window.innerWidth - btnRect.right) + 'px';
    dd.style.left  = 'auto';

    requestAnimationFrame(function () {
      var ddRect = dd.getBoundingClientRect();
      if (ddRect.bottom > window.innerHeight - 8) {
        dd.style.top = (btnRect.top - ddRect.height - 4) + 'px';
      }
    });
  };

  // ── Init ──────────────────────────────────────────────────────────────────

  window.ToolbarDropdown  = ToolbarDropdown;
  window.toolbarDropdown  = new ToolbarDropdown();
})();

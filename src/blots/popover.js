/**
 * PopoverBlot — a button that opens a floating popover via the native HTML
 * Popover API (popovertarget attributes — markup only, zero JavaScript, so
 * both export modes are identical and SharePoint-safe).
 *
 * Browsers without the Popover API get a hidden, non-openable popover (the
 * @supports guard hides it) rather than a permanently-visible block.
 */
(function () {
  'use strict';

  let _instanceCount = 0;

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function themeVals() {
    const cs = getComputedStyle(document.documentElement);
    const get = (v, fb) => cs.getPropertyValue(v).trim() || fb;
    return {
      primary: get('--color-primary', '#2563eb'),
      border:  get('--color-border', '#e2e8f0'),
      surface: get('--color-surface', '#f8fafc'),
      text:    get('--color-text', '#1e293b'),
      muted:   get('--color-text-muted', '#64748b'),
      radius:  get('--widget-border-radius', '0.5rem'),
      font:    get('--font-family-body', 'Georgia, serif'),
      shadow:  get('--widget-shadow', '0 1px 3px rgba(0,0,0,0.1)'),
    };
  }

  function buttonCss(t, styleName) {
    return styleName === 'ghost'
      ? 'background:transparent;color:' + t.primary + ';border:1px solid ' + t.primary + ';'
      : 'background:' + t.primary + ';color:#fff;border:1px solid ' + t.primary + ';';
  }

  function renderStatic(container, data, uid) {
    const t = themeVals();
    const popId = uid + '-pop';
    const titleHtml = data.title
      ? '<div style="font-family:' + t.font + ';font-size:15px;font-weight:700;color:' + t.text + ';margin-bottom:6px;">' + esc(data.title) + '</div>'
      : '';

    container.innerHTML =
      '<div id="' + uid + '" style="margin:8px 0;">' +
        '<style>' +
          '@supports not selector(:popover-open){#' + popId + '{display:none;}}' +
          '#' + popId + '::backdrop{background:rgba(15,23,42,0.25);}' +
        '</style>' +
        '<button popovertarget="' + popId + '" style="' + buttonCss(t, data.buttonStyle) +
          'padding:9px 18px;border-radius:999px;cursor:pointer;font-family:' + t.font + ';font-size:14px;font-weight:600;">' +
          esc(data.buttonLabel || 'More info') +
        '</button>' +
        '<div id="' + popId + '" popover style="max-width:440px;border:1px solid ' + t.border + ';border-radius:' + t.radius + ';' +
          'padding:16px 18px;box-shadow:' + t.shadow + ', 0 12px 30px rgba(0,0,0,0.12);background:#fff;">' +
          titleHtml +
          '<div style="font-family:' + t.font + ';font-size:14px;color:' + t.text + ';line-height:1.6;">' + window.HCESanitize.rich(data.content) + '</div>' +
          '<button popovertarget="' + popId + '" popovertargetaction="hide" style="margin-top:12px;padding:6px 14px;' +
            'border-radius:999px;border:1px solid ' + t.border + ';background:' + t.surface + ';color:' + t.muted + ';' +
            'cursor:pointer;font-family:' + t.font + ';font-size:12px;">Close</button>' +
        '</div>' +
      '</div>';
  }

  class PopoverBlot extends BaseWidgetBlot {
    static blotName          = 'popover';
    static tagName           = 'div';
    static widgetName        = 'popover';
    static widgetLabel       = 'Popover';
    static widgetIcon        = '💬';
    static widgetDescription = 'A button that opens a floating popover (native HTML, no JavaScript)';
    static defaultData       = { _v: 1, buttonLabel: 'More info', buttonStyle: 'primary', title: '', content: '<p>This popover opens and closes without any JavaScript.</p>' };

    attach() {
      super.attach();
      if (!this._uid) this._uid = 'po' + (++_instanceCount);
    }

    renderEditor(container, data) {
      container.innerHTML =
        '<div class="popover-widget">' +
          '<span class="popover-widget-btn popover-widget-btn--' + (data.buttonStyle === 'ghost' ? 'ghost' : 'primary') + '">' +
            esc(data.buttonLabel || 'More info') + '</span>' +
          '<div class="popover-widget-preview">' +
            (data.title ? '<strong>' + esc(data.title) + '</strong>' : '') +
            '<div>' + (data.content || '') + '</div>' +
          '</div>' +
        '</div>';
    }

    renderExport(container, data, ctx) {
      renderStatic(container, data, (ctx && ctx.uid) || this._uid || 'po0');
    }

    renderExportNoJS(container, data, ctx) {
      renderStatic(container, data, (ctx && ctx.uid) || this._uid || 'po0');
    }

    edit(data) {
      WidgetModal.open({
        title: 'Edit Popover',
        fields: [
          { key: 'buttonLabel', label: 'Button label', type: 'text' },
          { key: 'buttonStyle', label: 'Button style', type: 'select', options: [
            { value: 'primary', label: 'Solid (primary color)' },
            { value: 'ghost',   label: 'Outline' },
          ]},
          { key: 'title', label: 'Popover title (optional)', type: 'text' },
          { key: 'content', label: 'Popover content', type: 'rich' },
        ],
        data: data,
      }).then((newData) => {
        if (newData) this.updateData(Object.assign({}, data, newData));
      });
    }
  }

  WidgetRegistry.register(PopoverBlot);
})();

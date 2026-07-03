/**
 * EditableBoxBlot — a contenteditable region where READERS of the exported
 * document can type their own notes. Pure HTML attribute; identical in both
 * export modes and SharePoint-safe (contenteditable is not stripped).
 * Reader input is not persisted anywhere — it lives in their open page only,
 * which the default prompt makes clear.
 */
(function () {
  'use strict';

  const HEIGHTS = { small: 80, medium: 140, large: 220 };

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
    };
  }

  function renderStatic(container, data) {
    const t = themeVals();
    const minHeight = HEIGHTS[data.size] || HEIGHTS.medium;
    const promptHtml = data.prompt
      ? '<div style="font-family:' + t.font + ';font-size:14px;font-weight:600;color:' + t.text + ';margin-bottom:6px;">' + esc(data.prompt) + '</div>'
      : '';

    container.innerHTML =
      '<div style="margin:8px 0;">' +
        promptHtml +
        '<div contenteditable="true" style="min-height:' + minHeight + 'px;padding:12px 14px;' +
          'border:1px dashed ' + t.primary + ';border-radius:' + t.radius + ';background:' + t.surface + ';' +
          'font-family:' + t.font + ';font-size:14px;color:' + t.text + ';line-height:1.6;outline-color:' + t.primary + ';">' +
          (data.placeholder ? '<p style="color:' + t.muted + ';">' + esc(data.placeholder) + '</p>' : '') +
        '</div>' +
        '<div style="font-family:' + t.font + ';font-size:11px;color:' + t.muted + ';margin-top:4px;font-style:italic;">' +
          'Notes stay on this page only and are not saved.' +
        '</div>' +
      '</div>';
  }

  class EditableBoxBlot extends BaseWidgetBlot {
    static blotName          = 'editable-box';
    static tagName           = 'div';
    static widgetName        = 'editable-box';
    static widgetLabel       = 'Reader Notes Box';
    static widgetIcon        = '📝';
    static widgetDescription = 'An editable area where readers can type notes (contenteditable)';
    static defaultData       = { _v: 1, prompt: 'Your notes', placeholder: 'Click here and start typing…', size: 'medium' };

    renderEditor(container, data) {
      const minHeight = HEIGHTS[data.size] || HEIGHTS.medium;
      container.innerHTML =
        '<div class="editable-box-widget">' +
          (data.prompt ? '<strong>' + esc(data.prompt) + '</strong>' : '') +
          '<div class="editable-box-area" style="min-height:' + Math.min(minHeight, 120) + 'px;">' +
            '<span class="editable-box-ph">' + esc(data.placeholder || '') + '</span>' +
            '<span class="editable-box-badge">reader-editable</span>' +
          '</div>' +
        '</div>';
    }

    renderExport(container, data) { renderStatic(container, data); }
    renderExportNoJS(container, data) { renderStatic(container, data); }

    edit(data) {
      WidgetModal.open({
        title: 'Edit Reader Notes Box',
        fields: [
          { key: 'prompt', label: 'Prompt shown above the box', type: 'text' },
          { key: 'placeholder', label: 'Placeholder text inside the box', type: 'text' },
          { key: 'size', label: 'Box size', type: 'select', options: [
            { value: 'small',  label: 'Small' },
            { value: 'medium', label: 'Medium' },
            { value: 'large',  label: 'Large' },
          ]},
        ],
        data: data,
      }).then((newData) => {
        if (newData) this.updateData(Object.assign({}, data, newData));
      });
    }
  }

  WidgetRegistry.register(EditableBoxBlot);
})();

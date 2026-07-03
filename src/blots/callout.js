(function () {
  'use strict';

  const TYPE_CONFIG = {
    info:    { icon: 'ℹ️',  borderColor: '#2563eb', bgColor: '#eff6ff', role: 'note'  },
    warning: { icon: '⚠️',  borderColor: '#f59e0b', bgColor: '#fffbeb', role: 'note'  },
    success: { icon: '✅',  borderColor: '#16a34a', bgColor: '#f0fdf4', role: 'note'  },
    danger:  { icon: '🚨',  borderColor: '#dc2626', bgColor: '#fef2f2', role: 'alert' },
  };

  function escape(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  class CalloutBlot extends BaseWidgetBlot {
    static blotName          = 'callout';
    static tagName           = 'div';
    static widgetName        = 'callout';
    static widgetLabel       = 'Callout';
    static widgetIcon        = '⚠️';
    static widgetDescription = 'A highlighted alert or notice box';
    static defaultData       = { _v: 1, type: 'info', title: 'Note', body: '' };

    renderEditor(container, data) {
      const cfg = TYPE_CONFIG[data.type] || TYPE_CONFIG.info;
      container.setAttribute('role', cfg.role);
      container.innerHTML =
        '<div class="callout-preview callout-preview--' + data.type + '">' +
          '<span class="callout-preview-icon">' + cfg.icon + '</span>' +
          '<div class="callout-preview-body">' +
            (data.title ? '<strong>' + escape(data.title) + '</strong>' : '') +
            (data.body  ? '<div class="callout-rich-body">' + window.HCESanitize.rich(data.body) + '</div>' : '') +
          '</div>' +
        '</div>';
    }

    renderExport(container, data) {
      const cfg  = TYPE_CONFIG[data.type] || TYPE_CONFIG.info;
      const root = getComputedStyle(document.documentElement);

      const borderColor = {
        info:    root.getPropertyValue('--color-primary').trim() || cfg.borderColor,
        warning: root.getPropertyValue('--color-accent').trim()  || cfg.borderColor,
        success: cfg.borderColor,
        danger:  cfg.borderColor,
      }[data.type] || cfg.borderColor;

      const fontFamily = root.getPropertyValue('--font-family-body').trim() || 'Georgia, serif';
      const textColor  = root.getPropertyValue('--color-text').trim()       || '#1e293b';
      const mutedColor = root.getPropertyValue('--color-text-muted').trim() || '#64748b';
      const radius     = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      const titleHtml = data.title
        ? '<strong style="display:block;font-size:14px;font-weight:600;color:' + textColor + ';margin-bottom:4px;">' + escape(data.title) + '</strong>'
        : '';
      const bodyHtml = data.body
        ? '<div style="font-size:14px;color:' + mutedColor + ';line-height:1.6;">' + window.HCESanitize.rich(data.body) + '</div>'
        : '';

      container.setAttribute('role', cfg.role);
      container.innerHTML =
        '<div style="' +
          'display:flex;align-items:flex-start;gap:10px;' +
          'padding:12px 16px;' +
          'border-left:4px solid ' + borderColor + ';' +
          'background:' + cfg.bgColor + ';' +
          'border-radius:' + radius + ';' +
          'font-family:' + fontFamily + ';' +
          'margin:8px 0;' +
        '">' +
          '<span style="font-size:16px;line-height:1;flex-shrink:0;margin-top:2px;">' + cfg.icon + '</span>' +
          '<div>' + titleHtml + bodyHtml + '</div>' +
        '</div>';
    }

    edit(data) {
      WidgetModal.open({
        title: 'Edit Callout',
        fields: [
          { key: 'type', label: 'Type', type: 'select', options: [
            { value: 'info',    label: 'ℹ️  Info' },
            { value: 'warning', label: '⚠️  Warning' },
            { value: 'success', label: '✅  Success' },
            { value: 'danger',  label: '🚨  Danger' },
          ]},
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'body',  label: 'Body',  type: 'rich' },
        ],
        data: data,
      }).then((newData) => {
        if (newData) this.updateData(Object.assign({}, data, newData));
      });
    }
  }

  WidgetRegistry.register(CalloutBlot);
})();

(function () {
  'use strict';

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildAttributionHtml(escapedName, escapedRole) {
    if (!escapedName && !escapedRole) return '';
    if (escapedName && escapedRole) return '— ' + escapedName + ', ' + escapedRole;
    return '— ' + (escapedName || escapedRole);
  }

  class QuoteBlot extends BaseWidgetBlot {
    static blotName          = 'quote';
    static tagName           = 'div';
    static widgetName        = 'quote';
    static widgetLabel       = 'Quote';
    static widgetIcon        = '“';
    static widgetDescription = 'A stylized pull quote or blockquote';
    static defaultData       = {
      _v: 1,
      style: 'pull',
      quote: 'The only way to do great work is to love what you do.',
      attribution: 'Steve Jobs',
      role: '',
    };

    renderEditor(container, data) {
      const style    = data.style || 'pull';
      const attrHtml = buildAttributionHtml(esc(data.attribution), esc(data.role));

      container.innerHTML =
        '<blockquote class="quote-widget quote-widget--' + style + '">' +
          (style === 'pull'
            ? '<span class="quote-mark" aria-hidden="true">“</span>'
            : '') +
          '<div class="quote-text">' + window.HCESanitize.rich(data.quote) + '</div>' +
          (attrHtml
            ? '<footer class="quote-attribution"><cite>' + attrHtml + '</cite></footer>'
            : '') +
        '</blockquote>';
    }

    renderExport(container, data) {
      const style  = data.style || 'pull';
      const root   = getComputedStyle(document.documentElement);

      const primary = root.getPropertyValue('--color-primary').trim()        || '#2563eb';
      const surface = root.getPropertyValue('--color-surface').trim()        || '#f8fafc';
      const text    = root.getPropertyValue('--color-text').trim()           || '#1e293b';
      const muted   = root.getPropertyValue('--color-text-muted').trim()     || '#64748b';
      const font    = root.getPropertyValue('--font-family-body').trim()     || 'Georgia, serif';
      const radius  = root.getPropertyValue('--widget-border-radius').trim() || '0.5rem';

      let blockStyle, markHtml, textStyle;

      if (style === 'pull') {
        blockStyle =
          'font-family:' + font + ';text-align:center;padding:24px 32px;margin:8px 0;';
        markHtml =
          '<span aria-hidden="true" style="display:block;font-size:56px;line-height:0.6;' +
          'color:' + primary + ';font-family:Georgia,serif;margin-bottom:12px;">“</span>';
        textStyle =
          'font-size:1.4em;line-height:1.5;color:' + text + ';font-style:italic;margin:0;';
      } else if (style === 'sidebar') {
        blockStyle =
          'font-family:' + font + ';padding:12px 16px 12px 20px;' +
          'border-left:4px solid ' + primary + ';margin:8px 0;';
        markHtml = '';
        textStyle = 'font-size:1em;color:' + text + ';line-height:1.6;margin:0;';
      } else {
        blockStyle =
          'font-family:' + font + ';background:' + surface + ';' +
          'border-radius:' + radius + ';padding:20px 24px;text-align:center;margin:8px 0;';
        markHtml = '';
        textStyle =
          'font-size:1.1em;color:' + primary + ';font-weight:600;line-height:1.5;margin:0;';
      }

      const attrStyle =
        'display:block;margin-top:' + (style === 'sidebar' ? '8px' : '14px') + ';' +
        'font-size:0.85em;font-style:italic;color:' + muted + ';';

      const attrHtml = buildAttributionHtml(esc(data.attribution), esc(data.role));

      container.innerHTML =
        '<blockquote style="' + blockStyle + '">' +
          markHtml +
          '<div style="' + textStyle + '">' + window.HCESanitize.rich(data.quote) + '</div>' +
          (attrHtml
            ? '<footer><cite style="' + attrStyle + '">' + attrHtml + '</cite></footer>'
            : '') +
        '</blockquote>';
    }

    edit(data) {
      WidgetModal.open({
        title: 'Edit Quote',
        fields: [
          { key: 'style', label: 'Style', type: 'select', options: [
            { value: 'pull',      label: 'Pull — large centered quote' },
            { value: 'sidebar',   label: 'Sidebar — left-border accent' },
            { value: 'highlight', label: 'Highlight — colored background' },
          ]},
          { key: 'quote',       label: 'Quote text',                type: 'rich' },
          { key: 'attribution', label: 'Attribution (optional)',    type: 'text' },
          { key: 'role',        label: 'Role / title (optional)',   type: 'text' },
        ],
        data: data,
      }).then(function (newData) {
        if (newData) this.updateData(Object.assign({}, data, newData));
      }.bind(this));
    }
  }

  WidgetRegistry.register(QuoteBlot);
})();

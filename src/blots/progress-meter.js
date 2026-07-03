/**
 * ProgressMeterBlot — native <progress> / <meter> elements. Markup only,
 * identical in both export modes, SharePoint-safe.
 */
(function () {
  'use strict';

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function num(v, fallback) {
    const n = parseFloat(v);
    return isFinite(n) ? n : fallback;
  }

  function normalize(data) {
    const max = Math.max(num(data.max, 100), 0.0001);
    return {
      kind: data.kind === 'meter' ? 'meter' : 'progress',
      label: data.label || '',
      value: Math.min(Math.max(num(data.value, 0), 0), max),
      max: max,
      low: Math.min(Math.max(num(data.low, max * 0.3), 0), max),
      high: Math.min(Math.max(num(data.high, max * 0.8), 0), max),
      optimum: Math.min(Math.max(num(data.optimum, max * 0.9), 0), max),
      showValue: data.showValue !== false && data.showValue !== 'no',
    };
  }

  function themeVals() {
    const cs = getComputedStyle(document.documentElement);
    const get = (v, fb) => cs.getPropertyValue(v).trim() || fb;
    return {
      primary: get('--color-primary', '#2563eb'),
      text:    get('--color-text', '#1e293b'),
      muted:   get('--color-text-muted', '#64748b'),
      font:    get('--font-family-body', 'Georgia, serif'),
    };
  }

  function elementHtml(n, accent) {
    return n.kind === 'meter'
      ? '<meter value="' + n.value + '" min="0" max="' + n.max + '" low="' + n.low + '" high="' + n.high +
        '" optimum="' + n.optimum + '" style="width:100%;height:1.2rem;"></meter>'
      : '<progress value="' + n.value + '" max="' + n.max + '" style="width:100%;height:1.2rem;accent-color:' + accent + ';"></progress>';
  }

  function renderStatic(container, data) {
    const t = themeVals();
    const n = normalize(data);
    const valueText = n.showValue
      ? '<span style="color:' + t.muted + ';font-size:13px;">' + n.value + ' / ' + n.max + '</span>'
      : '';

    container.innerHTML =
      '<div style="margin:8px 0;font-family:' + t.font + ';">' +
        (n.label || valueText
          ? '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">' +
              '<span style="font-size:14px;font-weight:600;color:' + t.text + ';">' + esc(n.label) + '</span>' + valueText +
            '</div>'
          : '') +
        elementHtml(n, t.primary) +
      '</div>';
  }

  class ProgressMeterBlot extends BaseWidgetBlot {
    static blotName          = 'progress-meter';
    static tagName           = 'div';
    static widgetName        = 'progress-meter';
    static widgetLabel       = 'Progress / Meter';
    static widgetIcon        = '📊';
    static widgetDescription = 'A native progress bar or meter gauge';
    static defaultData       = { _v: 1, kind: 'progress', label: 'Completion', value: 65, max: 100, low: 30, high: 80, optimum: 90, showValue: true };

    renderEditor(container, data) {
      const n = normalize(data);
      container.innerHTML =
        '<div class="progress-meter-widget">' +
          '<div class="progress-meter-head">' +
            '<strong>' + esc(n.label || (n.kind === 'meter' ? 'Meter' : 'Progress')) + '</strong>' +
            (n.showValue ? '<span>' + n.value + ' / ' + n.max + '</span>' : '') +
          '</div>' +
          elementHtml(n, getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#2563eb') +
        '</div>';
    }

    renderExport(container, data) { renderStatic(container, data); }
    renderExportNoJS(container, data) { renderStatic(container, data); }

    edit(data) {
      WidgetModal.open({
        title: 'Edit Progress / Meter',
        fields: [
          { key: 'kind', label: 'Type', type: 'select', options: [
            { value: 'progress', label: 'Progress bar (completion)' },
            { value: 'meter',    label: 'Meter (value in a known range, e.g. score)' },
          ]},
          { key: 'label', label: 'Label', type: 'text' },
          { key: 'value', label: 'Value', type: 'text' },
          { key: 'max', label: 'Maximum', type: 'text' },
          { key: 'showValue', label: 'Show value text', type: 'select', options: [
            { value: 'yes', label: 'Yes' },
            { value: 'no',  label: 'No' },
          ]},
          { key: 'low', label: 'Meter only — "low" boundary', type: 'text' },
          { key: 'high', label: 'Meter only — "high" boundary', type: 'text' },
          { key: 'optimum', label: 'Meter only — optimum value', type: 'text' },
        ],
        data: Object.assign({}, data, { showValue: data.showValue === false || data.showValue === 'no' ? 'no' : 'yes' }),
      }).then((newData) => {
        if (!newData) return;
        newData.showValue = newData.showValue !== 'no';
        this.updateData(Object.assign({}, data, newData));
      });
    }
  }

  WidgetRegistry.register(ProgressMeterBlot);
})();

/**
 * ToggleRevealBlot — a checkbox/switch that reveals conditional content.
 * CSS-only interaction (input:checked ~ content), so the JS and no-JS exports
 * are identical and SharePoint-safe by construction.
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
    };
  }

  // Shared by renderExport and renderExportNoJS — the widget is CSS-only.
  function renderStatic(container, data, uid) {
    const t = themeVals();
    const isSwitch = (data.style || 'switch') === 'switch';
    const checked = data.startOn ? ' checked' : '';

    const switchCss = isSwitch
      ? '#' + uid + ' .hce-tr-track{display:inline-flex;align-items:center;width:40px;height:22px;padding:2px;' +
        'border-radius:999px;background:' + t.border + ';transition:background 0.2s ease;flex-shrink:0;}' +
        '#' + uid + ' .hce-tr-knob{width:18px;height:18px;border-radius:50%;background:#fff;' +
        'box-shadow:0 1px 3px rgba(0,0,0,0.25);transition:transform 0.2s ease;}' +
        '#' + uid + ' input:checked ~ label .hce-tr-track{background:' + t.primary + ';}' +
        '#' + uid + ' input:checked ~ label .hce-tr-knob{transform:translateX(18px);}'
      : '#' + uid + ' .hce-tr-box{width:16px;height:16px;flex-shrink:0;accent-color:' + t.primary + ';}';

    const control = isSwitch
      ? '<span class="hce-tr-track" aria-hidden="true"><span class="hce-tr-knob"></span></span>'
      : '<input type="checkbox" class="hce-tr-box" tabindex="-1" aria-hidden="true"' + (data.startOn ? ' checked' : '') + '>';

    container.innerHTML =
      '<div id="' + uid + '" style="border:1px solid ' + t.border + ';border-radius:' + t.radius + ';margin:8px 0;overflow:hidden;">' +
        '<style>' +
          '#' + uid + ' .hce-tr-cb{position:absolute;width:1px;height:1px;opacity:0;margin:0;padding:0;border:0;pointer-events:none;}' +
          '#' + uid + ' .hce-tr-content{display:none;padding:12px 16px;border-top:1px solid ' + t.border + ';' +
            'font-family:' + t.font + ';color:' + t.text + ';line-height:1.6;}' +
          '#' + uid + ' input.hce-tr-cb:checked ~ .hce-tr-content{display:block;}' +
          '#' + uid + ' input.hce-tr-cb:focus-visible ~ label{outline:2px solid ' + t.primary + ';outline-offset:-2px;}' +
          (isSwitch ? '' : '#' + uid + ' input.hce-tr-cb:checked ~ label .hce-tr-box{}') +
          switchCss +
        '</style>' +
        '<input type="checkbox" class="hce-tr-cb" id="' + uid + '-cb"' + checked + '>' +
        '<label for="' + uid + '-cb" style="display:flex;align-items:center;gap:10px;padding:12px 16px;cursor:pointer;' +
          'user-select:none;background:' + t.surface + ';font-family:' + t.font + ';font-size:15px;font-weight:600;color:' + t.text + ';">' +
          control +
          '<span>' + esc(data.label || 'Show details') + '</span>' +
        '</label>' +
        '<div class="hce-tr-content">' + window.HCESanitize.rich(data.content) + '</div>' +
      '</div>';
  }

  class ToggleRevealBlot extends BaseWidgetBlot {
    static blotName          = 'toggle-reveal';
    static tagName           = 'div';
    static widgetName        = 'toggle-reveal';
    static widgetLabel       = 'Toggle Reveal';
    static widgetIcon        = '🎚️';
    static widgetDescription = 'A switch or checkbox that reveals conditional content';
    static defaultData       = { _v: 1, label: 'Show details', style: 'switch', startOn: false, content: '<p>Content revealed when the toggle is on.</p>' };

    attach() {
      super.attach();
      if (!this._uid) this._uid = 'tr' + (++_instanceCount);
    }

    renderEditor(container, data) {
      container.innerHTML =
        '<div class="toggle-reveal-widget">' +
          '<div class="toggle-reveal-head">' +
            '<span class="toggle-reveal-pill toggle-reveal-pill--' + (data.style === 'checkbox' ? 'checkbox' : 'switch') +
              (data.startOn ? ' is-on' : '') + '" aria-hidden="true"><span class="toggle-reveal-knob"></span></span>' +
            '<strong>' + esc(data.label || 'Show details') + '</strong>' +
            '<span class="toggle-reveal-hint">reveals below when ' + (data.startOn ? 'off (starts on)' : 'on') + '</span>' +
          '</div>' +
          '<div class="toggle-reveal-body">' + (data.content || '') + '</div>' +
        '</div>';
    }

    renderExport(container, data, ctx) {
      renderStatic(container, data, (ctx && ctx.uid) || this._uid || 'tr0');
    }

    renderExportNoJS(container, data, ctx) {
      renderStatic(container, data, (ctx && ctx.uid) || this._uid || 'tr0');
    }

    edit(data) {
      WidgetModal.open({
        title: 'Edit Toggle Reveal',
        fields: [
          { key: 'label', label: 'Toggle label', type: 'text' },
          { key: 'style', label: 'Control style', type: 'select', options: [
            { value: 'switch',   label: 'Switch (pill)' },
            { value: 'checkbox', label: 'Checkbox' },
          ]},
          { key: 'startOn', label: 'Initial state', type: 'select', options: [
            { value: 'off', label: 'Off — content hidden until toggled' },
            { value: 'on',  label: 'On — content visible initially' },
          ]},
          { key: 'content', label: 'Revealed content', type: 'rich' },
        ],
        data: Object.assign({}, data, { startOn: data.startOn ? 'on' : 'off' }),
      }).then((newData) => {
        if (!newData) return;
        newData.startOn = newData.startOn === 'on' || newData.startOn === true;
        this.updateData(Object.assign({}, data, newData));
      });
    }
  }

  WidgetRegistry.register(ToggleRevealBlot);
})();

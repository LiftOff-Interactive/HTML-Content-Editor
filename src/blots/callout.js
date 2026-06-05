(function () {
  'use strict';

  class CalloutBlot extends BaseWidgetBlot {
    static blotName         = 'callout';
    static tagName          = 'div';
    static widgetName       = 'callout';
    static widgetLabel      = 'Callout';
    static widgetIcon       = '⚠️';
    static widgetDescription = 'A highlighted alert or notice box';
    static defaultData      = { _v: 1, type: 'info', title: 'Note', body: '' };

    renderEditor(container, data) {
      const typeLabel = { info: 'ℹ️', warning: '⚠️', success: '✅', danger: '🚨' };
      const icon = typeLabel[data.type] || typeLabel.info;
      container.innerHTML =
        '<div class="callout-preview callout-preview--' + data.type + '">' +
          '<span class="callout-preview-icon">' + icon + '</span>' +
          '<div class="callout-preview-body">' +
            '<strong>' + (data.title || '') + '</strong>' +
            (data.body ? '<p>' + data.body + '</p>' : '') +
          '</div>' +
        '</div>';
    }

    edit(data) {
      WidgetModal.open({
        title: 'Edit Callout',
        fields: [
          { key: 'type', label: 'Type', type: 'select', options: [
            { value: 'info',    label: 'Info' },
            { value: 'warning', label: 'Warning' },
            { value: 'success', label: 'Success' },
            { value: 'danger',  label: 'Danger' },
          ]},
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'body',  label: 'Body',  type: 'textarea' },
        ],
        data: data,
      }).then((newData) => {
        if (newData) this.updateData(Object.assign({}, data, newData));
      });
    }
  }

  WidgetRegistry.register(CalloutBlot);
})();

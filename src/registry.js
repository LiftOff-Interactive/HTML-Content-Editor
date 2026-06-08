(function () {
  'use strict';

  const _registry = new Map();

  function register(BlotClass) {
    if (!BlotClass.blotName) {
      throw new Error('Widget blot must define a static blotName');
    }
    _registry.set(BlotClass.blotName, BlotClass);
    Quill.register('formats/' + BlotClass.blotName, BlotClass);
  }

  function getAll() {
    return Array.from(_registry.values());
  }

  function get(blotName) {
    return _registry.get(blotName) || null;
  }

  window.WidgetRegistry = { register, getAll, get };
})();

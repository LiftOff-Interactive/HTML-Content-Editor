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

  // Widgets shown in palettes (slash + toolbar). Excludes internal blots that are
  // registered (so Quill + export know them) but must not be user-insertable —
  // e.g. the raw-html blot, which only ever appears via HTML import.
  function getVisible() {
    return getAll().filter(function (B) { return !B.widgetHidden; });
  }

  function get(blotName) {
    return _registry.get(blotName) || null;
  }

  window.WidgetRegistry = { register, getAll, getVisible, get };
})();

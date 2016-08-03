import declare from 'dojo/_base/declare';
import Deferred from 'dojo/Deferred';
import lang from 'dojo/_base/lang';

const __class = declare('argos.Modules._ModuleBase', null, {
  application: null,
  defaultViews: null,
  name: 'Module',
  enabled: true,
  constructor: function constructor(options) {
    lang.mixin(this, options);
  },
  init: function init() {
    const deferred =  new Deferred();
    try {
      this.loadViews();
      this.loadToolBars();
      this.loadCustomizations();
      this.loadAppStatePromises();
      deferred.resolve(true);
    } catch(error) {
      deferred.reject(error);
    }
    return deferred.promise;
  },
  loadViews: function loadViews() {
  },
  loadCustomizations: function loadCustomizations() {
  },
  loadToolbars: function loadToolbars() {
  },
  loadAppStatePromises: function loadAppStatePromises() {
  },
  registerView: function resgisterView(view, domNode) {
    this.application.resgisterView(view, domNode);
  },
  registerCustomization: function registerCustomization(set, id, spec) {
    this.applicationModule.registerCustomization(set, id, spec);
  },
  registerToolbar: function registerToolbar(name, toolbar, domNode) {
      this.application.registerToolbar(name, toolbar, domNode);
  },
  registerDefaultViews: function registerDefaultViews(views) {
    if (this.application.defaultViews && views) {
      this.application.defaultViews.forEach(function register(defaultView) {
        const idx = views.indexOf(defaultView);
        if (idx === -1) {
          views.push(defaultView);
        }
      });
    }
  },
});

export default __class;

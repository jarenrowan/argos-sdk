/*
 * See copyright file.
 */
import declare from 'dojo/_base/declare';
import lang from 'dojo/_base/lang';
import Deferred from 'dojo/Deferred';
import all from 'dojo/promise/all';

const _moduleConfigs = [];
const _modules = {};
const __class = lang.setObject('argos.Modules.ModuleManager', {
  moduleConfigs: _moduleConfigs,
  modules: _modules,
  constructor: function constructor(options) {
    lang.mixin(this, options);
  },
 
  registerModule: function registerModule(moduleConfig) {
    this.moduleConfigs.push(moduleConfig);
  },
  getModule: function getModule(moduleName) {
    const def = new Deferred();
    let module = this.modules[moduleName];
    if (module) {
      def.resolve(module);
    } else {
       this.loadModule(moduleName).then((module) => {
        def.resolve(module);
      }, () => {
        def.reject(null);
      });
    }
    return def.promise;
  },
  getModuleConfig: function getModuleConfig(moduleName) {
    const def = new Deferred();
    const cfgs = this.moduleConfigs.filter((cfg)=>{
      if ( cfg.name === moduleName) {
        return true;
      }
    });
    if( cfgs && cfgs.length > 0) {
      def.resolve(cfgs[0]);
    } else {
      def.resolve(null);
    }
    return def.promise;
  },
  loadModule:  function loadModule(moduleName) {
    const def = new Deferred();
    this.getModuleConfig(moduleName).then((cfg) => {
      let module = null;
      if (cfg && cfg.ctor ) {
        try {
          let options = {
            application: this.application
          };
          lang.mixin(options, cfg);
          module = cfg.ctor(options);
          this.modules[moduleName] = module;
          def.resolve(module);
        } catch (error) {
          def.reject(error);
          console.log('Error loading module:' + moduleName + ' error:' + error); //eslint-disable-line
        }
      }
    }, () => {
      def.reject(null);
    });
    return def.promise;
  },
  initModule:  function intModule(cfg) {
    const def = new Deferred();
    if (cfg.initialized) {
      def.resolve(true);
    }
    this.getModule(cfg.name).then((module) => {
      try {
        module.init().then((reult) => {
          cfg.initialized = true;
          def.resolve(result);
        }, (error) => {
          def.reject(error);
          console.log('Error init module: ' + moduleName + ' error:' + error); //eslint-disable-line
        });
      } catch (error) {
        def.reject(error);
        console.log('Error init module: ' + moduleName + ' error:' + error); //eslint-disable-line
      }
    }, (error) => {
      def.reject(error);
      console.log('Error init module:' + moduleName + ' error:' + error);//eslint-disable-line
    });
    return def.promise;
  },
  initModules:  function intModule() {
    const def = new Deferred();
    const inits = [];
    this.moduleConfigs.forEach((cfg) => {
      inits.push(this.initModule(cfg));
    });
    if (inits.length > 0) {
      all(inits).then((results) => {
        def.resolve(results);
      }, (error) => {
        def.reject(error);
      });
    } else {
      def.resolve(null);
    }
    return def.promise;
  },
});
export default __class;

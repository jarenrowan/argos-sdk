import * as Memory from 'dojo/store/Memory';
import * as declare from 'dojo/_base/declare';
import _ConfigureBase from '../_ConfigureBase';
import getResource from '../I18n';

const resource = getResource('configureQuickActions');

/**
 * @class argos.Views.ConfigureQuickActions
 *
 *
 * @extends argos._ConfigureBase
 *
 */
const __class = declare('argos.Views.ConfigureQuickActions', [_ConfigureBase], {
  // Localization
  titleText: resource.titleText,

  // View Properties
  id: 'configure_quickactions',
  idProperty: '$key',
  labelProperty: '$descriptor',

  getConfiguredView: function getConfiguredView() {
    return App.getView(this.options.viewId);
  },
  onSave: function onSave() {
    const selected = this.getSelectedKeys();
    const all = this._sortActions(this.options.actions, this.getOrderedKeys());

    const save = all.map((action) => {
      if (selected.indexOf(action.id) >= 0) {
        action.visible = true;
      } else {
        action.visible = false;
      }

      return action;
    });

    this._ensurePrefs();
    App.preferences.quickActions[this.options.viewId] = save;

    App.persistPreferences();

    const view = this.getConfiguredView();
    if (view) {
      view.clear();
      view.refreshRequired = true;
    }

    ReUI.back();
  },
  _sortActions: function _sortActions(actions, order) {
    return actions.sort((a, b) => {
      const i = order.indexOf(a.id);
      const j = order.indexOf(b.id);

      if (i < j) {
        return -1;
      }

      if (i > j) {
        return 1;
      }

      return 0;
    });
  },
  clear: function clear() {
    this.store = null;
    this.inherited(arguments);
  },
  show: function show() {
    this.refreshRequired = true;
    this.inherited(arguments);
  },
  createStore: function createStore() {
    let list = [];
    const all = this.options.actions.map(action => action.id);
    const order = this.getSavedOrderedKeys();

    // De-dup id's
    const combined = order.concat(all);
    let reduced = combined.reduce((previous, current) => {
      if (previous.indexOf(current) === -1) {
        previous.push(current);
      }

      return previous;
    }, []);

    // The order array could have had stale id's
    reduced = reduced.filter((key) => {
      return all.indexOf(key) !== -1;
    });

    list = this._sortActions(this.options.actions, this.getSavedOrderedKeys()).map((action) => {
      if (reduced.indexOf(action.id) > -1) {
        return {
          $key: action.id,
          $descriptor: action.label,
        };
      }
      return null;
    });

    list = list.filter((item) => {
      return item !== null;
    });

    return new Memory({
      data: list,
    });
  },
  getSavedOrderedKeys: function getSavedOrderedKeys() {
    const save = this._getQuickActionPrefs();
    return save.map((action) => {
      return action.id;
    });
  },
  getSavedSelectedKeys: function getSavedSelectedKeys() {
    let save = this._getQuickActionPrefs();
    save = save.filter((action) => {
      return action.visible === true;
    });

    return save.map((action) => {
      return action.id;
    });
  },
  _getQuickActionPrefs: function _getQuickActionPrefs() {
    this._ensurePrefs();
    return App.preferences.quickActions[this.options.viewId] || [];
  },
  _ensurePrefs: function _ensurePrefs() {
    if (!App.preferences) {
      App.preferences = {};
    }

    if (!App.preferences.quickActions) {
      App.preferences.quickActions = {};
    }
  },
});

export default __class;
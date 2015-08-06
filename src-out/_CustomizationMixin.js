define('argos/_CustomizationMixin', ['exports', 'module', 'dojo/_base/declare', 'dojo/_base/lang'], function (exports, module, _dojo_baseDeclare, _dojo_baseLang) {
  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  /* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  /**
   * @class argos._CustomizationMixin
   * Customization Mixin is a general purpose Customization Engine. It takes a customization object and
   * a layout object and applies the customization defined to the layout.
   *
   * A customization object has the following properties:
   *
   * * `at`: `function(item)` - passes the current item in the list, the function should return true if this is the item being modified (or is at where you want to insert something).
   * * `at`: `{Number}` - May optionally define the index of the item instead of a function.
   * * `type`: `{String}` - enum of `insert`, `modify`, `replace` or `remove` that indicates the type of customization.
   * * `where`: `{String}` - enum of `before` or `after` only needed when type is `insert`.
   * * `value`: `{Object}` - the entire object to create (insert or replace) or the values to overwrite (modify), not needed for remove.
   * * `value`: `{Object[]}` - if inserting you may pass an array of items to create.
   *
   * @alternateClassName _CustomizationMixin
   */

  var _declare = _interopRequireDefault(_dojo_baseDeclare);

  var _lang = _interopRequireDefault(_dojo_baseLang);

  var expand = function expand(expression) {
    if (typeof expression === 'function') {
      return expression.apply(this, Array.prototype.slice.call(arguments, 1));
    }

    return expression;
  };

  var __class = (0, _declare['default'])('argos._CustomizationMixin', null, {
    _layoutCompiled: null,
    _layoutCompiledFrom: null,
    id: null,
    customizationSet: null,
    enableCustomizations: true,
    constructor: function constructor() {
      this._layoutCompiled = {};
      this._layoutCompiledFrom = {};
    },
    _getCustomizationsFor: function _getCustomizationsFor(customizationSubSet) {
      var customizationSet = customizationSubSet ? this.customizationSet + '/' + customizationSubSet : this.customizationSet;
      return App.getCustomizationsFor(customizationSet, this.id);
    },
    _createCustomizedLayout: function _createCustomizedLayout(layout, customizationSubSet) {
      var customizationSet = customizationSubSet ? this.customizationSet + '/' + customizationSubSet : this.customizationSet;
      var key = customizationSet + '#' + this.id;
      var source = layout;

      if (source === this._layoutCompiledFrom[key] && this._layoutCompiled[key]) {
        return this._layoutCompiled[key]; // same source layout, no changes
      }

      if (this.enableCustomizations) {
        var customizations = this._getCustomizationsFor(customizationSubSet);
        if (customizations && customizations.length > 0) {
          layout = this._compileCustomizedLayout(customizations, source, null); //eslint-disable-line
        }
      }

      this._layoutCompiled[key] = layout;
      this._layoutCompiledFrom[key] = source;

      return layout;
    },
    _compileCustomizedLayout: function _compileCustomizedLayout(customizations, layout, parent) {
      var customizationCount = customizations.length;
      var layoutCount = layout.length;
      var applied = {};
      var output = undefined;

      if (_lang['default'].isArray(layout)) {
        output = [];
        for (var i = 0; i < layoutCount; i++) {
          var row = layout[i];

          /* for compatibility */
          // will modify the underlying row
          if (typeof row.name === 'undefined' && typeof row.property === 'string') {
            row.name = row.property;
          }

          var insertRowsBefore = [];
          var insertRowsAfter = [];

          for (var j = 0; j < customizationCount; j++) {
            if (applied[j]) {
              continue; // todo: allow a customization to be applied to a layout more than once?
            }

            var customization = customizations[j];
            var _stop = false;

            if (expand(customization.at, row, parent, i, layoutCount, customization)) {
              switch (customization.type) {//eslint-disable-line
                case 'remove':
                  // full stop
                  _stop = true;
                  row = null;
                  break;
                case 'replace':
                  // full stop
                  _stop = true;
                  row = expand(customization.value, row);
                  break;
                case 'modify':
                  // make a shallow copy if we haven't already
                  if (row === layout[i]) {
                    row = _lang['default'].mixin({}, row);
                  }

                  row = _lang['default'].mixin(row, expand(customization.value, row));
                  break;
                case 'insert':
                  var insertRowsTarget = customization.where !== 'before' ? insertRowsAfter : insertRowsBefore;
                  var expandedValue = expand(customization.value, row);

                  if (_lang['default'].isArray(expandedValue)) {
                    insertRowsTarget.push.apply(insertRowsTarget, expandedValue);
                  } else {
                    insertRowsTarget.push(expandedValue);
                  }

                  break;
              }

              applied[j] = true;
            }

            if (_stop) {
              break;
            }
          }

          output.push.apply(output, insertRowsBefore);

          if (row) {
            var children = row.children && 'children' || row.as && 'as';
            if (children) {
              // make a shallow copy if we haven't already
              if (row === layout[i]) {
                row = _lang['default'].mixin({}, row);
              }

              row[children] = this._compileCustomizedLayout(customizations, row[children], row);
            }

            output.push(row);
          }
          output.push.apply(output, insertRowsAfter);
        }
        /*
         for any non-applied, insert only, customizations, if they have an `or` property that expands into a true expression
         the value is applied at the end of the parent group that the `or` property (ideally) matches.
        */
        for (var k = 0; k < customizationCount; k++) {
          if (applied[k]) {
            continue;
          }

          var customization = customizations[k];

          if (customization.type === 'insert' && (expand(customization.or, parent, customization) || customization.at === true)) {
            output.push(expand(customization.value, null));
          }
        }
      } else if (_lang['default'].isFunction(layout)) {
        return this._compileCustomizedLayout(customizations, layout.call(this), name);
      } else if (_lang['default'].isObject(layout)) {
        output = {};

        for (var _name in layout) {
          if (_lang['default'].isArray(layout[_name])) {
            output[_name] = this._compileCustomizedLayout(customizations, layout[_name], _name);
          } else {
            output[_name] = layout[_name];
          }
        }
      }

      return output;
    }
  });

  _lang['default'].setObject('Sage.Platform.Mobile._CustomizationMixin', __class);
  module.exports = __class;
});

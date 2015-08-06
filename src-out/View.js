define('argos/View', ['exports', 'module', 'dojo/_base/declare', 'dojo/_base/lang', 'dijit/_WidgetBase', './_ActionMixin', './_CustomizationMixin', './_Templated', './_ErrorHandleMixin'], function (exports, module, _dojo_baseDeclare, _dojo_baseLang, _dijit_WidgetBase, _ActionMixin2, _CustomizationMixin2, _Templated2, _ErrorHandleMixin2) {
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

  var _declare = _interopRequireDefault(_dojo_baseDeclare);

  var _lang = _interopRequireDefault(_dojo_baseLang);

  var _WidgetBase2 = _interopRequireDefault(_dijit_WidgetBase);

  var _ActionMixin3 = _interopRequireDefault(_ActionMixin2);

  var _CustomizationMixin3 = _interopRequireDefault(_CustomizationMixin2);

  var _Templated3 = _interopRequireDefault(_Templated2);

  var _ErrorHandleMixin3 = _interopRequireDefault(_ErrorHandleMixin2);

  /**
   * @class argos.View
   * View is the root Class for all views and incorporates all the base features,
   * events, and hooks needed to successfully render, hide, show, and transition.
   *
   * All Views are dijit Widgets, namely utilizing its: widgetTemplate, connections, and attributeMap
   * @alternateClassName View
   * @mixins argos._ActionMixin
   * @mixins argos._CustomizationMixin
   * @mixins argos._Templated
   * @mixins argos._ErrorHandleMixin
   */
  var __class = (0, _declare['default'])('argos.View', [_WidgetBase2['default'], _ActionMixin3['default'], _CustomizationMixin3['default'], _Templated3['default'], _ErrorHandleMixin3['default']], {
    /**
     * This map provides quick access to HTML properties, most notably the selected property of the container
     */
    attributeMap: {
      'title': {
        node: 'domNode',
        type: 'attribute',
        attribute: 'title'
      },
      'selected': {
        node: 'domNode',
        type: 'attribute',
        attribute: 'selected'
      }
    },
    /**
     * The widgetTemplate is a Simplate that will be used as the main HTML markup of the View.
     * @property {Simplate}
     */
    widgetTemplate: new Simplate(['<ul id="{%= $.id %}" title="{%= $.titleText %}" class="overthrow {%= $.cls %}">', '</ul>']),
    _loadConnect: null,
    /**
     * The id is used to uniquely define a view and is used in navigating, history and for HTML markup.
     * @property {String}
     */
    id: 'generic_view',
    /**
     * The titleText string will be applied to the top toolbar during {@link #show show}.
     */
    titleText: 'Generic View',
    /**
     * This views toolbar layout that defines all toolbar items in all toolbars.
     * @property {Object}
     */
    tools: null,
    /**
     * May be defined along with {@link App#hasAccessTo Application hasAccessTo} to incorporate View restrictions.
     */
    security: null,
    /**
     * A reference to the globa App object
     */
    app: null,
    /**
     * May be used to specify the service name to use for data requests. Setting false will force the use of the default service.
     * @property {String/Boolean}
     */
    serviceName: false,
    connectionName: false,
    constructor: function constructor(options) {
      this.app = options && options.app || window.App;
    },
    startup: function startup() {
      this.inherited(arguments);
    },
    /**
     * Called from {@link App#_viewTransitionTo Applications view transition handler} and returns
     * the fully customized toolbar layout.
     * @return {Object} The toolbar layout
     */
    getTools: function getTools() {
      var tools = this._createCustomizedLayout(this.createToolLayout(), 'tools');
      this.onToolLayoutCreated(tools);
      return tools;
    },
    /**
     * Called after toolBar layout is created;
     *
     */
    onToolLayoutCreated: function onToolLayoutCreated() {},
    /**
     * Returns the tool layout that defines all toolbar items for the view
     * @return {Object} The toolbar layout
     */
    createToolLayout: function createToolLayout() {
      return this.tools || {};
    },
    /**
     * Called on loading of the application.
     */
    init: function init() {
      this.startup();
      this.initConnects();
    },
    /**
     * Establishes this views connections to various events
     */
    initConnects: function initConnects() {
      this._loadConnect = this.connect(this.domNode, 'onload', this._onLoad);
    },
    _onLoad: function _onLoad(evt, el, o) {
      this.disconnect(this._loadConnect);
      this.load(evt, el, o);
    },
    /**
     * Called once the first time the view is about to be transitioned to.
     * @deprecated
     */
    load: function load() {},
    /**
     * Called in {@link #show show()} before ReUI is invoked.
     * @param {Object} options Navigation options passed from the previous view.
     * @return {Boolean} True indicates view needs to be refreshed.
     */
    refreshRequiredFor: function refreshRequiredFor(options) {
      if (this.options) {
        return !!options; // if options provided, then refresh
      }

      return true;
    },
    /**
     * Should refresh the view, such as but not limited to:
     * Emptying nodes, requesting data, rendering new content
     */
    refresh: function refresh() {},
    /**
     * The onBeforeTransitionAway event.
     * @param self
     */
    onBeforeTransitionAway: function onBeforeTransitionAway() {},
    /**
     * The onBeforeTransitionTo event.
     * @param self
     */
    onBeforeTransitionTo: function onBeforeTransitionTo() {},
    /**
     * The onTransitionAway event.
     * @param self
     */
    onTransitionAway: function onTransitionAway() {},
    /**
     * The onTransitionTo event.
     * @param self
     */
    onTransitionTo: function onTransitionTo() {},
    /**
     * The onActivate event.
     * @param self
     */
    onActivate: function onActivate() {},
    /**
     * The onShow event.
     * @param self
     */
    onShow: function onShow() {},
    activate: function activate(tag, data) {
      // todo: use tag only?
      if (data && this.refreshRequiredFor(data.options)) {
        this.refreshRequired = true;
      }

      this.options = data && data.options || this.options || {};

      if (this.options.title) {
        this.set('title', this.options.title);
      } else {
        this.set('title', this.get('title') || this.titleText);
      }

      this.onActivate(this);
    },
    _getScrollerAttr: function _getScrollerAttr() {
      return this.scrollerNode || this.domNode;
    },
    /**
     * Shows the view using iUI in order to transition to the new element.
     * @param {Object} options The navigation options passed from the previous view.
     * @param transitionOptions {Object} Optional transition object that is forwarded to ReUI.
     */
    show: function show(options, transitionOptions) {
      this.errorHandlers = this._createCustomizedLayout(this.createErrorHandlers(), 'errorHandlers');

      if (this.onShow(this) === false) {
        return;
      }

      if (this.refreshRequiredFor(options)) {
        this.refreshRequired = true;
      }

      this.options = options || this.options || {};

      if (this.options.title) {
        this.set('title', this.options.title);
      } else {
        this.set('title', this.get('title') || this.titleText);
      }

      var tag = this.getTag();
      var data = this.getContext();

      var newOptions = _lang['default'].mixin(transitionOptions || {}, {
        tag: tag,
        data: data
      });
      ReUI.show(this.domNode, newOptions);
    },
    /**
     * Expands the passed expression if it is a function.
     * @param {String/Function} expression Returns string directly, if function it is called and the result returned.
     * @return {String} String expression.
     */
    expandExpression: function expandExpression(expression) {
      if (typeof expression === 'function') {
        return expression.apply(this, Array.prototype.slice.call(arguments, 1));
      }

      return expression;
    },
    /**
     * Called before the view is transitioned (slide animation complete) to.
     */
    beforeTransitionTo: function beforeTransitionTo() {
      this.onBeforeTransitionTo(this);
    },
    /**
     * Called before the view is transitioned (slide animation complete) away from.
     */
    beforeTransitionAway: function beforeTransitionAway() {
      this.onBeforeTransitionAway(this);
    },
    /**
     * Called after the view has been transitioned (slide animation complete) to.
     */
    transitionTo: function transitionTo() {
      if (this.refreshRequired) {
        this.refreshRequired = false;
        this.refresh();
      }

      this.onTransitionTo(this);
    },
    /**
     * Called after the view has been transitioned (slide animation complete) away from.
     */
    transitionAway: function transitionAway() {
      this.onTransitionAway(this);
    },
    /**
     * Returns the primary SDataService instance for the view.
     * @return {Object} The Sage.SData.Client.SDataService instance.
     */
    getService: function getService() {
      return this.app.getService(this.serviceName); /* if false is passed, the default service will be returned */
    },
    getConnection: function getConnection() {
      return this.getService();
    },
    getTag: function getTag() {},
    /**
     * Returns the options used for the View {@link #getContext getContext()}.
     * @return {Object} Options to be used for context.
     */
    getOptionsContext: function getOptionsContext() {
      if (this.options && this.options.negateHistory) {
        return {
          negateHistory: true
        };
      }
      return this.options;
    },
    /**
     * Returns the context of the view which is a small summary of key properties.
     * @return {Object} Vital View properties.
     */
    getContext: function getContext() {
      // todo: should we track options?
      return {
        id: this.id,
        options: this.getOptionsContext()
      };
    },
    /**
     * Returns the defined security.
     * @param access
     */
    getSecurity: function getSecurity() {
      return this.security;
    }
  });

  _lang['default'].setObject('Sage.Platform.Mobile.View', __class);
  module.exports = __class;
});
/*tools*/
// todo: remove load entirely?
/*self*/ /*self*/ /*self*/ /*self*/ /*self*/ /*self*/ /*access*/

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
 * @class argos.View
 * View is the root Class for all views and incorporates all the base features,
 * events, and hooks needed to successfully render, hide, show, and transition.
 *
 * All Views are dijit Widgets, namely utilizing its: widgetTemplate, connections, and attributeMap
 * @alternateClassName View
 * @mixins argos._ActionMixin
 * @mixins argos._CustomizationMixin
 * @mixins argos._Templated
 */
define('argos/View', [
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dijit/_WidgetBase',
    './_ActionMixin',
    './_CustomizationMixin',
    './_Templated'
], function(
    declare,
    lang,
    array,
    _WidgetBase,
    _ActionMixin,
    _CustomizationMixin,
    _Templated
) {
    var __class = declare('argos.View', [_WidgetBase, _ActionMixin, _CustomizationMixin, _Templated], {
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
        widgetTemplate: new Simplate([
            '<ul id="{%= $.id %}" title="{%= $.titleText %}" class="overthrow {%= $.cls %}">',
            '</ul>'
        ]),
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
         * @property {Object}
         * Localized error messages. One general error message, and messages by HTTP status code.
         */
        errorText: {
            general: 'A server error occured.',
            status: {
            }
        },
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
         * May be used to specify the service name to use for data requests. Setting false will force the use of the default service.
         * @property {String/Boolean}
         */
        serviceName: false,
        connectionName: false,
        constructor: function() {
        },
        startup: function() {
            this.inherited(arguments);
            this.errorHandlers = this._createCustomizedLayout(this.createErrorHandlers(), 'error_handlers');
        },
        /**
         * @property {Object}
         * Http Error Status codes. See http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
         */
        HTTP_STATUS: {
            BAD_REQUEST: 400,
            UNAUTHORIZED: 401,
            PAYMENT_REQUIRED: 402,
            FORBIDDEN: 403,
            NOT_FOUND: 404,
            METHOD_NOT_ALLOWED: 405,
            NOT_ACCEPTABLE: 406,
            PROXY_AUTH_REQUIRED: 407,
            REQUEST_TIMEOUT: 408,
            CONFLICT: 409,
            GONE: 410,
            LENGTH_REQUIRED: 411,
            PRECONDITION_FAILED: 412,
            REQUEST_ENTITY_TOO_LARGE: 413,
            REQUEST_URI_TOO_LONG: 414,
            UNSUPPORTED_MEDIA_TYPE: 415,
            REQUESTED_RANGE_NOT_SATISFIABLE: 416,
            EXPECTATION_FAILED: 417
        },
        /**
         * @property {Array} errorHandlers
         * Array of objects that should contain a name string property, test function, and handle function.
         *
         */
        errorHandlers: null,

        /**
         * @return {Array} Returns an array of error handlers
         */
        createErrorHandlers: function() {
            return this.errorHandlers || [];
        },
        /**
         * Starts matching and executing errorHandlers.
         * @param {Error} error Error to pass to the errorHandlers
         */
        handleError: function(error) {
            if (!error) {
                return;
            }

            var matches, noop, getNext, len;

            noop = function() {};

            matches = array.filter(this.errorHandlers, function(handler) {
                return handler.test && handler.test.call(this, error);
            }.bind(this));

            len = matches.length;

            getNext = function(index) {
                // next() chain has ended, return a no-op so calling next() in the last chain won't error
                if (index === len) {
                    return noop;
                }

                // Return a closure with index and matches captured.
                // The handle function can call its "next" param to continue the chain.
                return function() {
                    var nextHandler, nextFn;
                    nextHandler = matches[index];
                    nextFn = nextHandler && nextHandler.handle;

                    nextFn.call(this, error, getNext(index + 1));
                }.bind(this);
            }.bind(this);

            if (len > 0 && matches[0].handle) {
                // Start the handle chain, the handle can call next() to continue the iteration
                matches[0].handle.call(this, error, getNext(1));
            }
        },
        /**
         * Called from {@link App#_viewTransitionTo Applications view transition handler} and returns
         * the fully customized toolbar layout.
         * @return {Object} The toolbar layout
         */
        getTools: function() {
            var tools = this._createCustomizedLayout(this.createToolLayout(), 'tools');
            this.onToolLayoutCreated(tools);
            return tools;
        },
        /**
         * Called after toolBar layout is created;
         *
         */
        onToolLayoutCreated:function(tools){
        },
        /**
         * Returns the tool layout that defines all toolbar items for the view
         * @return {Object} The toolbar layout
         */
        createToolLayout: function() {
            return this.tools || {};
        },
        /**
         * Called on loading of the application.
         */
        init: function() {
            this.startup();
            this.initConnects();
        },
        /**
         * Establishes this views connections to various events
         */
        initConnects: function() {
            var h;
            this._loadConnect = this.connect(this.domNode, 'onload', this._onLoad);
        },
        _onLoad: function(evt, el, o) {
            this.disconnect(this._loadConnect);

            this.load(evt, el, o);
        },
        /**
         * Called once the first time the view is about to be transitioned to.
         * @deprecated
         */
        load: function() {
            // todo: remove load entirely?
        },
        /**
         * Called in {@link #show show()} before ReUI is invoked.
         * @param {Object} options Navigation options passed from the previous view.
         * @return {Boolean} True indicates view needs to be refreshed.
         */
        refreshRequiredFor: function(options) {
            if (this.options) {
                return !!options; // if options provided, then refresh
            } else {
                return true;
            }
        },
        /**
         * Should refresh the view, such as but not limited to:
         * Emptying nodes, requesting data, rendering new content
         */
        refresh: function() {
        },
        /**
         * The onBeforeTransitionAway event.
         * @param self
         */
        onBeforeTransitionAway: function(self) {
        },
        /**
         * The onBeforeTransitionTo event.
         * @param self
         */
        onBeforeTransitionTo: function(self) {
        },
        /**
         * The onTransitionAway event.
         * @param self
         */
        onTransitionAway: function(self) {
        },
        /**
         * The onTransitionTo event.
         * @param self
         */
        onTransitionTo: function(self) {
        },
        /**
         * The onActivate event.
         * @param self
         */
        onActivate: function(self) {
        },
        /**
         * The onShow event.
         * @param self
         */
        onShow: function(self) {
        },
        activate: function(tag, data) {
            // todo: use tag only?
            if (data && this.refreshRequiredFor(data.options))
            {
                this.refreshRequired = true;
            }

            this.options = (data && data.options) || this.options || {};

            if (this.options.title) {
                this.set('title', this.options.title);
            } else {
                this.set('title', (this.get('title') || this.titleText));
            }

            this.onActivate(this);
        },
        _getScrollerAttr: function() {
            return this.scrollerNode || this.domNode;
        },
        /**
         * Shows the view using iUI in order to transition to the new element.
         * @param {Object} options The navigation options passed from the previous view.
         * @param transitionOptions {Object} Optional transition object that is forwarded to ReUI.
         */
        show: function(options, transitionOptions) {
            var tag, data;

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
                this.set('title', (this.get('title') || this.titleText));
            }

            tag = this.getTag();
            data = this.getContext();

            transitionOptions = lang.mixin(transitionOptions || {}, {tag: tag, data: data});
            ReUI.show(this.domNode, transitionOptions);
        },
        /**
         * Expands the passed expression if it is a function.
         * @param {String/Function} expression Returns string directly, if function it is called and the result returned.
         * @return {String} String expression.
         */
        expandExpression: function(expression) {
            if (typeof expression === 'function')
                return expression.apply(this, Array.prototype.slice.call(arguments, 1));
            else
                return expression;
        },
        /**
         * Called before the view is transitioned (slide animation complete) to.
         */
        beforeTransitionTo: function() {
            this.onBeforeTransitionTo(this);
        },
        /**
         * Called before the view is transitioned (slide animation complete) away from.
         */
        beforeTransitionAway: function() {
            this.onBeforeTransitionAway(this);
        },
        /**
         * Called after the view has been transitioned (slide animation complete) to.
         */
        transitionTo: function() {
            if (this.refreshRequired)
            {
                this.refreshRequired = false;
                this.refresh();
            }

            this.onTransitionTo(this);
        },
        /**
         * Called after the view has been transitioned (slide animation complete) away from.
         */
        transitionAway: function() {
            this.onTransitionAway(this);
        },
        /**
         * Returns the primary SDataService instance for the view.
         * @return {Object} The Sage.SData.Client.SDataService instance.
         */
        getService: function() {
            return App.getService(this.serviceName); /* if false is passed, the default service will be returned */
        },
        getConnection: function() {
            return this.getService();
        },
        getTag: function() {
        },
        /**
         * Returns the options used for the View {@link #getContext getContext()}.
         * @return {Object} Options to be used for context.
         */
        getOptionsContext: function() {
            if (this.options && this.options.negateHistory)
                return { negateHistory: true };
            else
                return this.options;
        },
        /**
         * Returns the context of the view which is a small summary of key properties.
         * @return {Object} Vital View properties.
         */
        getContext: function() {
            // todo: should we track options?
            return {id: this.id, options: this.getOptionsContext()};
        },
        /**
         * Returns the defined security.
         * @param access
         */
        getSecurity: function(access) {
            return this.security;
        },
        /**
         * Gets the general error message, or the error message for the status code.
         */
        getErrorMessage: function(error) {
            var message = this.errorText.general;

            if (error) {
                message = this.errorText.status[error.status] || this.errorText.general;
            }

            return message;
        }
    });

    lang.setObject('Sage.Platform.Mobile.View', __class);
    return __class;
});


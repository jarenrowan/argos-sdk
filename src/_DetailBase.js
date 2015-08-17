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
import declare from 'dojo/_base/declare';
import lang from 'dojo/_base/lang';
import Deferred from 'dojo/_base/Deferred';
import connect from 'dojo/_base/connect';
import query from 'dojo/query';
import dom from 'dojo/dom';
import domClass from 'dojo/dom-class';
import domStyle from 'dojo/dom-style';
import domConstruct from 'dojo/dom-construct';
import format from './Format';
import utility from './Utility';
import ErrorManager from './ErrorManager';
import View from './View';
import TabWidget from './TabWidget';

/**
 * @class argos._DetailBase
 * A Detail View represents a single record and should display all the info the user may need about the entry.
 *
 * A Detail entry is identified by its key (idProperty) which is how it requests the data via the endpoint.
 *
 * @alternateClassName _DetailBase
 * @extends argos.View
 * @requires argos.Format
 * @requires argos.Utility
 * @requires argos.ErrorManager
 */
const __class = declare('argos._DetailBase', [View, TabWidget], {
  /**
   * @property {Object}
   * Creates a setter map to html nodes, namely:
   *
   * * detailContent => contentNode's innerHTML
   *
   */
  attributeMap: {
    detailContent: {
      node: 'contentNode',
      type: 'innerHTML',
    },
  },
  /**
   * @property {Simplate}
   * The template used to render the view's main DOM element when the view is initialized.
   * This template includes loadingTemplate.
   *
   * The default template uses the following properties:
   *
   *      name                description
   *      ----------------------------------------------------------------
   *      id                   main container div id
   *      title                main container div title attr
   *      cls                  additional class string added to the main container div
   *      resourceKind         set to data-resource-kind
   *
   */
  widgetTemplate: new Simplate([
    '<div id="{%= $.id %}" title="{%= $.titleText %}" class="detail panel {%= $.cls %}" data-dojo-attach-event="onclick:toggleDropDown" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>',
      '{%! $.loadingTemplate %}',
      '{%! $.quickActionTemplate %}',
      '<div class="panel-content" data-dojo-attach-point="contentNode">',
        '{%! $.tabContentTemplate %}',
        '{%! $.moreTabListTemplate %}',
      '</div>',
    '</div>',
  ]),
  /**
   * @property {Simplate}
   * HTML shown when no data is available.
   */
  emptyTemplate: new Simplate([]),
  /**
   * @property {Simplate}
   * HTML shown when data is being loaded.
   *
   * `$` => the view instance
   */
  loadingTemplate: new Simplate([
    '<div class="panel-loading-indicator">',
    '<div class="row"><span class="fa fa-spinner fa-spin"></span><div>{%: $.loadingText %}</div></div>',
    '</div>',
  ]),
  /**
   * @property {Simplate}
   * HTML that creates the quick action list
   */
  quickActionTemplate: new Simplate([
    '<div class="quick-actions" data-dojo-attach-point="quickActions"></div>',
  ]),
  /**
   * @property {Simplate}
   * HTML that creates the detail header displaying information about the tab list
   *
   * `$` => the view instance
   */
  detailHeaderTemplate: new Simplate([
    '<div class="detail-header">',
    '{%: $.value %}',
    '</div>',
  ]),
  /**
   * @property {Simplate}
   * HTML that starts a new section
   *
   * `$` => the view instance
   */
  sectionBeginTemplate: new Simplate([
    '{% if (!$$.isTabbed) { %}',
        '<h2 data-action="toggleSection" class="{% if ($.collapsed || $.options.collapsed) { %}collapsed{% } %}">',
        '<button class="{% if ($.collapsed) { %}{%: $$.toggleExpandClass %}{% } else { %}{%: $$.toggleCollapseClass %}{% } %}" aria-label="{%: $$.toggleCollapseText %}"></button>',
        '{%: ($.title || $.options.title) %}',
        '</h2>',
    '{% } %}',
    '{% if ($.list || $.options.list) { %}',
      '{% if ($.cls || $.options.cls) { %}',
        '<ul class="{%= ($.cls || $.options.cls) %}">',
      '{% } else { %}',
        '<ul class="detailContent list">',
      '{% } %}',
    '{% } else { %}',
      '{% if ($.cls || $.options.cls) { %}',
        '<div class="{%= ($.cls || $.options.cls) %}">',
          '{% } else { %}',
            '<div class="detailContent">',
          '{% } %}',
    '{% } %}',
  ]),
  /**
   * @property {Simplate}
   * HTML that ends a section
   *
   * `$` => the view instance
   */
  sectionEndTemplate: new Simplate([
    '{% if ($.list || $.options.list) { %}',
    '</ul>',
    '{% } else { %}',
    '</div>',
    '{% } %}',
  ]),
  /**
   * @property {Simplate}
   * HTML that is used for a property in the detail layout
   *
   * * `$` => detail layout row
   * * `$$` => view instance
   */
  propertyTemplate: new Simplate([
    '<div class="row{% if(!$.value) { %} no-value{% } %} {%= $.cls %}" data-property="{%= $.property || $.name %}">',
    '<label>{%: $.label %}</label>',
    '<span>{%= $.value %}</span>', // todo: create a way to allow the value to not be surrounded with a span tag
    '</div>',
  ]),
   /**
   * @property {Simplate}
   * HTML that is used for a property in the detail layout
   *
   * * `$` => detail layout row
   * * `$$` => view instance
   */
  securedPropertyTemplate:new Simplate([
    '<div class="row{% if(!$.value) { %} no-value{% } %} {%= $.cls %}" data-property="{%= $.property || $.name %}">',
    '<label>{%: $.label %}</label>',
    '<span>{%= $$.noAccessText %}</span>', 
    '</div>',
  ]),
  /**
   * @property {Simplate}
   * HTML that is used for detail layout items that point to related views, includes a label and links the value text
   *
   * * `$` => detail layout row
   * * `$$` => view instance
   */
  relatedPropertyTemplate: new Simplate([
    '<div class="row{% if(!$.value) { %} no-value{% } %} {%= $.cls %}">',
    '<label>{%: $.label %}</label>',
    '<span>',
    '<a data-action="activateRelatedEntry" data-view="{%= $.view %}" data-context="{%: $.context %}" data-descriptor="{%: $.descriptor || $.value %}">',
    '{%= $.value %}',
    '</a>',
    '</span>',
    '</div>',
  ]),
  /**
   * @property {Simplate}
   * HTML that is used for detail layout items that point to related views, displayed as an icon and text
   *
   * * `$` => detail layout row
   * * `$$` => view instance
   */
  relatedTemplate: new Simplate([
    '<li class="{%= $.cls %}">',
    '<a data-action="activateRelatedList" data-view="{%= $.view %}" data-context="{%: $.context %}" {% if ($.disabled) { %}data-disable-action="true"{% } %} class="{% if ($.disabled) { %}disabled{% } %}">',
    '{% if ($.icon) { %}',
    '<img src="{%= $.icon %}" alt="icon" class="icon" />',
    '{% } else if ($.iconClass) { %}',
    '<div class="{%= $.iconClass %}" alt="icon"></div>',
    '{% } %}',
    '<span class="related-item-label">{%: $.label %}</span>',
    '</a>',
    '</li>',
  ]),
  /**
   * @property {Simplate}
   * HTML that is used for detail layout items that fire an action, displayed with label and property value
   *
   * * `$` => detail layout row
   * * `$$` => view instance
   */
  actionPropertyTemplate: new Simplate([
    '<div class="row {%= $.cls %}">',
    '<label>{%: $.label %}</label>',
    '<span>',
    '<a data-action="{%= $.action %}" {% if ($.disabled) { %}data-disable-action="true"{% } %} class="{% if ($.disabled) { %}disabled{% } %}">',
    '{%= $.value %}',
    '</a>',
    '</span>',
    '</div>',
  ]),
  /**
   * @property {Simplate}
   * HTML that is used for detail layout items that fire an action, displayed as an icon and text
   *
   * * `$` => detail layout row
   * * `$$` => view instance
   */
  actionTemplate: new Simplate([
    '<li class="{%= $.cls %}{% if ($.disabled) { %} disabled{% } %}">',
    '<a data-action="{%= $.action %}" {% if ($.disabled) { %}data-disable-action="true"{% } %} class="{% if ($.disabled) { %}disabled{% } %}">',
    '{% if ($.icon) { %}',
    '<img src="{%= $.icon %}" alt="icon" class="icon" />',
    '{% } else if ($.iconClass) { %}',
    '<div class="{%= $.iconClass %}" alt="icon"></div>',
    '{% } %}',
    '<label>{%: $.label %}</label>',
    '<span>{%= $.value %}</span>',
    '</a>',
    '</li>',
  ]),
  /**
   * @property {Simplate}
   * HTML that is shown when not available
   *
   * `$` => the view instance
   */
  notAvailableTemplate: new Simplate([
    '<div class="not-available">{%: $.notAvailableText %}</div>',
  ]),
  /**
   * @property {String}
   * The unique identifier of the view
   */
  id: 'generic_detail',
  /**
   * @property {Object}
   * The dojo store this view will use for data exchange.
   */
  store: null,
  /**
   * @property {Object}
   * The data entry
   */
  entry: null,
  /**
   * @property {Object}
   * The layout definition that constructs the detail view with sections and rows
   */
  layout: null,
  /**
   * @cfg {String/Object}
   * May be used for verifying the view is accessible
   */
  security: false,
  /**
   * @property {String}
   * The customization identifier for this class. When a customization is registered it is passed
   * a path/identifier which is then matched to this property.
   */
  customizationSet: 'detail',
  /**
   * @property {Boolean}
   * Controls if the view should be exposed
   */
  expose: false,
  /**
   * @property {Boolean}
   * Controls whether the view will render as a tab view or the previous list view
   */
  isTabbed: true,
  /**
   * @property {String}
   * Controls how the view determines the quick action section by mapping this string with that on the detail view (should be overwritten)
   */
  quickActionSection: 'QuickActionsSection',
  /**
   * @deprecated
   */
  editText: 'Edit',
  /**
   * @cfg {String}
   * Font awesome icon to be used by the more list item
   */
  icon: 'fa fa-chevron',
  /**
   * @cfg {String}
   * Information text that is concatenated with the entity type
   */
  informationText: 'Information',
  /**
   * @cfg {String}
   * Default title text shown in the top toolbar
   */
  titleText: 'Detail',
  /**
   * @cfg {String}
   * Default text used in the header title, followed by information
   */
  entityText: 'Entity',
  /**
   * @property {String}
   * Helper string for a basic section header text
   */
  detailsText: 'Details',
  /**
   * @property {String}
   * Text shown while loading and used in loadingTemplate
   */
  loadingText: 'loading...',
  /**
   * @property {String}
   * Text used in the notAvailableTemplate
   */
  noAccessText: 'No Access.',
  /**
   * @property {String}
   * Text used in the notAvailableTemplate
   */
  notAvailableText: 'The requested data is not available.',
  /**
   * @property {String}
   * ARIA label text for a collapsible section header
   */
  toggleCollapseText: 'toggle collapse',
  /**
   * @property {String}
   * CSS class for the collapse button when in a expanded state
   */
  toggleCollapseClass: 'fa fa-chevron-down',
  /**
   * @property {String}
   * CSS class for the collapse button when in a collapsed state
   */
  toggleExpandClass: 'fa fa-chevron-right',
  /**
   * @property {Object}
   * dojo connect object associated to the setOrientation event
   */
  _orientation: null,
  /**
   * @cfg {String}
   * The view id to be taken to when the Edit button is pressed in the toolbar
   */
  editView: false,
  /**
   * @property {Object[]}
   * Store for mapping layout options to an index on the HTML node
   */
  _navigationOptions: null,

  // Store properties
  itemsProperty: '',
  idProperty: '',
  labelProperty: '',
  entityProperty: '',
  versionProperty: '',

  /**
   * Extends the dijit widget postCreate to subscribe to the global `/app/refresh` event and clear the view.
   */
  postCreate: function postCreate() {
    this.inherited(arguments);
    this.subscribe('/app/refresh', this._onRefresh);
    this.clear();
  },
  createErrorHandlers: function createErrorHandlers() {
    this.errorHandlers = this.errorHandlers || [{
      name: 'Aborted',
      test: (error) => {
        return error.aborted;
      },
      handle: (error, next) => {
        this.options = false; // force a refresh
        next();
      },
    }, {
      name: 'AlertError',
      test: (error) => {
        return error.status !== this.HTTP_STATUS.NOT_FOUND && !error.aborted;
      },
      handle: (error, next) => {
        alert(this.getErrorMessage(error));//eslint-disable-line
        next();
      },
    }, {
      name: 'NotFound',
      test: (error) => {
        return error.status === this.HTTP_STATUS.NOT_FOUND;
      },
      handle: (error, next) => {
        domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'only');
        next();
      },
    }, {
      name: 'CatchAll',
      test: () => true,
      handle: (error, next) => {
        const errorItem = {
          viewOptions: this.options,
          serverError: error,
        };

        ErrorManager.addError(this.getErrorMessage(error), errorItem);
        domClass.remove(this.domNode, 'panel-loading');
        next();
      },
    }];

    return this.errorHandlers;
  },
  /**
   * Sets and returns the toolbar item layout definition, this method should be overriden in the view
   * so that you may define the views toolbar items.
   * @return {Object} this.tools
   * @template
   */
  createToolLayout: function createToolLayout() {
    return this.tools || (this.tools = {
      'tbar': [{
        id: 'edit',
        cls: 'fa fa-pencil fa-fw fa-lg',
        action: 'navigateToEditView',
        security: App.getViewSecurity(this.editView, 'update'),
      }, {
        id: 'refresh',
        cls: 'fa fa-refresh fa-fw fa-lg',
        action: '_refreshClicked',
      }],
    });
  },
  _refreshClicked: function _refreshClicked() {
    this.clear();
    this.refreshRequired = true;
    this.refresh();

    this.onRefreshClicked();
  },
  /**
   * Called when the user clicks the refresh toolbar button.
   */
  onRefreshClicked: function onRefreshClicked() {},
  /**
   * Extends the {@link _ActionMixin#invokeAction mixins invokeAction} to stop if `data-disableAction` is true
   * @param name
   * @param {Object} parameters Collection of `data-` attributes from the node
   * @param {Event} evt
   * @param {HTMLElement} el
   */
  invokeAction: function invokeAction(name, parameters/*, evt, el*/) {
    if (parameters && /true/i.test(parameters.disableAction)) {
      return null;
    }
    return this.inherited(arguments);
  },
  /**
   * Toggles the collapsed state of the section.
   */
  toggleSection: function toggleSection(params) {
    const node = dom.byId(params.$source);
    if (node) {
      domClass.toggle(node, 'collapsed');
      const button = query('button', node)[0];
      if (button) {
        domClass.toggle(button, this.toggleCollapseClass);
        domClass.toggle(button, this.toggleExpandClass);
      }
    }
  },
  /**
   * Handler for the getting the detail resource type from the id and placing the header into the detail view..
   * @private
   */
  placeDetailHeader: function placeDetailHeader() {
    const value = this.entityText + ' ' + this.informationText;
    domConstruct.place(this.detailHeaderTemplate.apply({ value: value }, this), this.tabList, 'before');
  },
  /**
   * Handler for the global `/app/refresh` event. Sets `refreshRequired` to true if the key matches.
   * @param {Object} options The object published by the event.
   * @private
   */
  _onRefresh: function _onRefresh(o) {
    const descriptor = o.data && o.data[this.labelProperty];

    if (this.options && this.options.key === o.key) {
      this.refreshRequired = true;

      if (descriptor) {
        this.options.title = descriptor;
        this.set('title', descriptor);
      }
    }
  },
  /**
   * Handler for the related entry action, navigates to the defined `data-view` passing the `data-context`.
   * @param {Object} params Collection of `data-` attributes from the source node.
   */
  activateRelatedEntry: function activateRelatedEntry(params) {
    if (params.context) {
      this.navigateToRelatedView(params.view, parseInt(params.context, 10), params.descriptor);
    }
  },
  /**
   * Handler for the related list action, navigates to the defined `data-view` passing the `data-context`.
   * @param {Object} params Collection of `data-` attributes from the source node.
   */
  activateRelatedList: function activateRelatedList(params) {
    if (params.context) {
      this.navigateToRelatedView(params.view, parseInt(params.context, 10), params.descriptor);
    }
  },
  /**
   * Navigates to the defined `this.editView` passing the current `this.entry` as default data.
   * @param {HTMLElement} el
   */
  navigateToEditView: function navigateToEditView(/*el*/) {
    const view = App.getView(this.editView);
    if (view) {
      const entry = this.entry;
      view.show({
        entry: entry,
        fromContext: this,
      });
    }
  },
  /**
   * Navigates to a given view id passing the options retrieved using the slot index to `this._navigationOptions`.
   * @param {String} id View id to go to
   * @param {Number} slot Index of the context to use in `this._navigationOptions`.
   * @param {String} descriptor Optional descriptor option that is mixed in.
   */
  navigateToRelatedView: function navigateToRelatedView(id, slot, descriptor) {
    const options = this._navigationOptions[slot];
    const view = App.getView(id);

    if (descriptor && options) {
      options.descriptor = descriptor;
    }

    if (this.entry) {
      options.selectedEntry = this.entry;
    }

    options.fromContext = this;
    if (view && options) {
      view.show(options);
    }
  },
  /**
   * Sets and returns the Detail view layout by following a standard for section and rows:
   *
   * The `this.layout` itself is an array of section objects where a section object is defined as such:
   *
   *     {
   *        name: 'String', // Required. unique name for identification/customization purposes
   *        title: 'String', // Required. Text shown in the section header
   *        list: boolean, // Optional. Default false. Controls if the group container for child rows should be a div (false) or ul (true)
   *        children: [], // Array of child row objects
   *     }
   *
   * A child row object has:
   *
   *     {
   *        name: 'String', // Required. unique name for identification/customization purposes
   *        property: 'String', // Optional. The property of the current entity to bind to
   *        label: 'String', // Optional. Text shown in the label to the left of the property
   *        onCreate: function(), // Optional. You may pass a function to be called when the row is added to the DOM
   *        include: boolean, // Optional. If false the row will not be included in the layout
   *        exclude: boolean, // Optional. If true the row will not be included in the layout
   *        template: Simplate, // Optional. Override the HTML Simplate used for rendering the value (not the row) where `$` is the row object
   *        tpl: Simplate, // Optional. Same as template.
   *        renderer: function(), // Optional. Pass a function that receives the current value and returns a value to be rendered
   *        encode: boolean, // Optional. If true it will encode HTML entities
   *        cls: 'String', // Optional. Additional CSS class string to be added to the row div
   *        use: Simplate, // Optional. Override the HTML Simplate used for rendering the row (not value)
   *        provider: function(entry, propertyName), // Optional. Function that accepts the data entry and the property name and returns the extracted value. By default simply extracts directly.
   *        value: Any // Optional. Provide a value directly instead of binding
   *     }
   *
   * @return {Object[]} Detail layout definition
   */
  createLayout: function createLayout() {
    return this.layout || [];
  },
  /**
   * Processes the given layout definition using the data entry response by rendering and inserting the HTML nodes and
   * firing any onCreate events defined.
   * @param {Object[]} layout Layout definition
   * @param {Object} entry data response
   */
  processLayout: function processLayout(layout, entry) {
    const rows = (layout.children || layout.as || layout);
    const options = layout.options || (layout.options = {
      title: this.detailsText,
    });
    const sectionQueue = [];
    let sectionStarted = false;
    const callbacks = [];

    let sectionNode;

    this.placeTabList(this.contentNode);

    for (let i = 0; i < rows.length; i++) {
      const current = rows[i];
      const include = this.expandExpression(current.include, entry);
      const exclude = this.expandExpression(current.exclude, entry);
      let context;

      if (include !== undefined && !include) {
        continue;
      }

      if (exclude !== undefined && exclude) {
        continue;
      }

      if (current.children || current.as) {
        if (sectionStarted) {
          sectionQueue.push(current);
        } else {
          this.processLayout(current, entry);
        }

        continue;
      }

      if (!sectionStarted) {
        let section;
        sectionStarted = true;
        if (this.isTabbed) {
          if (layout.name === this.quickActionSection) {
            section = domConstruct.toDom(this.sectionBeginTemplate.apply(layout, this) + this.sectionEndTemplate.apply(layout, this));
            sectionNode = section;
            domConstruct.place(section, this.quickActions);
          } else {
            const tab = domConstruct.toDom(this.tabListItemTemplate.apply(layout, this));
            section = domConstruct.toDom(this.sectionBeginTemplate.apply(layout, this) + this.sectionEndTemplate.apply(layout, this));
            sectionNode = section;
            domStyle.set(section, {
              display: 'none',
            });
            this.tabMapping.push(section);
            this.tabs.push(tab);
            domConstruct.place(section, this.contentNode);
          }
        } else {
          section = domConstruct.toDom(this.sectionBeginTemplate.apply(layout, this) + this.sectionEndTemplate.apply(layout, this));
          sectionNode = section.childNodes[1];
          domConstruct.place(section, this.contentNode);
        }
      }

      const provider = current.provider || utility.getValue;
      const property = typeof current.property === 'string' ? current.property : current.name;
      const value = typeof current.value === 'undefined' ? provider(entry, property, entry) : current.value;
      let rendered;
      let formatted;
      if (current.template || current.tpl) {
        rendered = (current.template || current.tpl).apply(value, this);
        formatted = current.encode === true ? format.encode(rendered) : rendered;
      } else if (current.renderer && typeof current.renderer === 'function') {
        rendered = current.renderer.call(this, value);
        formatted = current.encode === true ? format.encode(rendered) : rendered;
      } else {
        formatted = current.encode !== false ? format.encode(value) : value;
      }

      const data = lang.mixin({}, {
        entry: entry,
        value: formatted,
        raw: value,
      }, current);

      if (current.descriptor) {
        data.descriptor = typeof current.descriptor === 'function' ? this.expandExpression(current.descriptor, entry, value) : provider(entry, current.descriptor);
      }

      if (current.action) {
        data.action = this.expandExpression(current.action, entry, value);
      }

      const hasAccess = App.hasAccessTo(current.security);

      if (current.security) {
        data.disabled = !hasAccess;
      }

      if (current.disabled && hasAccess) {
        data.disabled = this.expandExpression(current.disabled, entry, value);
      }

      if (current.view) {
        context = lang.mixin({}, current.options);

        if (current.key) {
          context.key = typeof current.key === 'function' ? this.expandExpression(current.key, entry) : provider(entry, current.key);
        }
        if (current.where) {
          context.where = this.expandExpression(current.where, entry);
        }
        if (current.resourceKind) {
          context.resourceKind = this.expandExpression(current.resourceKind, entry);
        }
        if (current.resourceProperty) {
          context.resourceProperty = this.expandExpression(current.resourceProperty, entry);
        }
        if (current.resourcePredicate) {
          context.resourcePredicate = this.expandExpression(current.resourcePredicate, entry);
        }
        if (current.dataSet) {
          context.dataSet = this.expandExpression(current.dataSet, entry);
        }
        if (current.title) {
          context.title = current.title;
        }

        if (current.resetSearch) {
          context.resetSearch = current.resetSearch;
        } else {
          context.resetSearch = true;
        }

        data.view = current.view;
        data.context = (this._navigationOptions.push(context) - 1);
      }

      const useListTemplate = (layout.list || options.list);

      let template;
      // priority: use > (relatedPropertyTemplate | relatedTemplate) > (actionPropertyTemplate | actionTemplate) > propertyTemplate
      if (current.use) {
        template = current.use;
      } else if (current.view && useListTemplate) {
        template = this.relatedTemplate;
        current.relatedItem = true;
      } else if (current.view) {
        template = this.relatedPropertyTemplate;
      } else if (current.action && useListTemplate) {
        template = this.actionTemplate;
      } else if (current.action) {
        template = this.actionPropertyTemplate;
      } else {
        template = this.propertyTemplate;
      }

      const rowNode = this.createRowNode(current, sectionNode, entry, template, data);
      if (current.relatedItem) {
        try {
          this._processRelatedItem(data, context, rowNode);
        } catch (e) {
          // error processing related node
          console.error(e);//eslint-disable-line
        }
      }

      if (current.onCreate) {
        callbacks.push({
          row: current,
          node: rowNode,
          value: value,
          entry: entry,
        });
      }
    }

    for (let i = 0; i < callbacks.length; i++) {
      const item = callbacks[i];
      item.row.onCreate.apply(this, [item.row, item.node, item.value, item.entry]);
    }

    for (let i = 0; i < sectionQueue.length; i++) {
      const current = sectionQueue[i];
      this.processLayout(current, entry);
    }
  },
  createSecuredRowNode: function(fieldSecurityProfile, layout, sectionNode, entry, template, data){
    return domConstruct.place(this.securedPropertyTemplate.apply(data, this), sectionNode);
  },
  createRowNode: function createRowNode(layout, sectionNode, entry, template, data) {
    let rowNode;
    let fieldSecurityProfile = App.securityService.getFieldSecurityProfile(entry, layout.property);
    if(fieldSecurityProfile && !fieldSecurityProfile.allowRead){
      return  this.createSecuredRowNode(fieldSecurityProfile, layout, sectionNode, entry, template, data);
    }     
    return domConstruct.place(template.apply(data, this), sectionNode);
  },
  _getStoreAttr: function _getStoreAttr() {
    return this.store || (this.store = this.createStore());
  },
  /**
   * CreateStore is the core of the data handling for Detail Views. By default it is empty but it should return
   * a dojo store of your choosing. There are {@link _SDataDetailMixin Mixins} available for SData.
   * @return {*}
   */
  createStore: function createStore() {
    return null;
  },
  /**
   * Required for binding to ScrollContainer which utilizes iScroll that requires to be refreshed when the
   * content (therefor scrollable area) changes.
   */
  onContentChange: function onContentChange() {},
  /**
   * @template
   * Optional processing of the returned entry before it gets processed into layout.
   * @param {Object} entry Entry from data store
   * @return {Object} By default does not do any processing
   */
  preProcessEntry: function preProcessEntry(entry) {
    return entry;
  },
  /**
   * Takes the entry from the data store, applies customization, applies any custom item process and then
   * passes it to process layout.
   * @param {Object} entry Entry from data store
   */
  processEntry: function processEntry(entry) {
    this.entry = this.preProcessEntry(entry);

    if (this.entry) {
      this.processLayout(this._createCustomizedLayout(this.createLayout()), this.entry);
      this.createTabs(this.tabs);
      this.placeDetailHeader(this.entry);
    } else {
      this.set('detailContent', '');
    }
  },
  _onGetComplete: function _onGetComplete(entry) {
    try {
      if (entry) {
        this.applySecurityProfile(entry);
        this.processEntry(entry);
      } else {
        domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'only');
      }

      domClass.remove(this.domNode, 'panel-loading');

      /* this must take place when the content is visible */
      this.onContentChange();
    } catch (e) {
      console.error(e);//eslint-disable-line
    }
  },
  _onGetError: function _onGetError(getOptions, error) {
    this.handleError(error);
  },
  /**
   * Initiates the request.
   */
  requestData: function requestData() {
    domClass.add(this.domNode, 'panel-loading');

    const store = this.get('store');
    if (store) {
      const getOptions = {};

      this._applyStateToGetOptions(getOptions);

      const getExpression = this._buildGetExpression() || null;
      const getResults = store.get(getExpression, getOptions);

      Deferred.when(getResults,
        this._onGetComplete.bind(this),
        this._onGetError.bind(this, getOptions)
      );

      return getResults;
    }

    console.warn('Error requesting data, no store was defined. Did you mean to mixin _SDataDetailMixin to your detail view?');//eslint-disable-line
  },
  _buildGetExpression: function _buildGetExpression() {
    const options = this.options;
    return options && (options.id || options.key);
  },
  _applyStateToGetOptions: function _applyStateToGetOptions(/*getOptions*/) {},
  /**
   * Determines if the view should be refresh by inspecting and comparing the passed navigation option key with current key.
   * @param {Object} options Passed navigation options.
   * @return {Boolean} True if the view should be refreshed, false if not.
   */
  refreshRequiredFor: function refreshRequiredFor(options) {
    if (this.options) {
      if (options) {
        if (this.options.key !== options.key) {
          return true;
        }
      }

      return false;
    }

    return this.inherited(arguments);
  },
  /**
   * Extends the {@link View#activate parent implementation} to set the nav options title attribute to the descriptor
   * @param tag
   * @param data
   */
  activate: function activate(tag, data) {
    const options = data && data.options;
    if (options && options.descriptor) {
      options.title = options.title || options.descriptor;
    }

    this.inherited(arguments);
  },
  show: function show(options) {
    if (options && options.descriptor) {
      options.title = options.title || options.descriptor;
    }

    this.inherited(arguments);
  },
  /**
   * Returns the view key
   * @return {String} View key
   */
  getTag: function getTag() {
    return this.options && this.options.key;
  },
  /**
   * Extends the {@link View#getContext parent implementation} to also set the resourceKind, key and descriptor
   * @return {Object} View context object
   */
  getContext: function getContext() {
    return lang.mixin(this.inherited(arguments), {
      resourceKind: this.resourceKind,
      key: this.options.key,
      descriptor: this.options.descriptor,
    });
  },
  /**
   * Extends the {@link View#beforeTransitionTo parent implementation} to also clear the view if `refreshRequired` is true
   * @return {Object} View context object
   */
  beforeTransitionTo: function beforeTransitionTo() {
    this.inherited(arguments);

    if (this.refreshRequired) {
      this.clear();
    }
  },
  onTransitionTo: function onTransitionTo() {
    this.inherited(arguments);

    this.orientation = connect.subscribe('/app/setOrientation', this, this.reorderTabs);
  },
  /**
   * If a security breach is detected it sets the content to the notAvailableTemplate, otherwise it calls
   * {@link #requestData requestData} which starts the process sequence.
   */
  refresh: function refresh() {
    if (this.security && !App.hasAccessTo(this.expandExpression(this.security))) {
      domConstruct.place(this.notAvailableTemplate.apply(this), this.contentNode, 'last');
      return;
    }

    this.requestData();
  },
  /**
   * Clears the view by replacing the content with the empty template and emptying the stored row contexts.
   */
  clear: function clear() {
    this.set('detailContent', this.emptyTemplate.apply(this));
    this.clearTabs();
    if (this.quickActions) {
      domConstruct.empty(this.quickActions);
    }

    this._navigationOptions = [];
  },
  _processRelatedItem: function _processRelatedItem(data, context, rowNode) {
    const view = App.getView(data.view);
    const options = {};

    if (view) {
      options.where = context ? context.where : '';
      view.getListCount(options).then((result) => {
        if (result >= 0) {
          const labelNode = query('.related-item-label', rowNode)[0];
          if (labelNode) {
            const html = '<span class="related-item-count">' + result + '</span>';
            domConstruct.place(html, labelNode, 'before');
          } else {
            console.warn('Missing the "related-item-label" dom node.');//eslint-disable-line
          }
        }
      });
    }
  },
  destroy: function destroy() {
    this.inherited(arguments);
  }
});

lang.setObject('Sage.Platform.Mobile._DetailBase', __class);
export default __class;

const declare = require ('dojo/_base/declare');
import _Templated from './_Templated';


/**
 * @class argos.TabWidget
 * @alternateClassName TabWidget
 */
const __class = declare('argos.TabWidget', [_Templated], {
  /**
   * @property {Simplate}
   * HTML that defines a new tab list
   */
  tabContentTemplate: new Simplate([
    '{%! $.tabListTemplate %}',
  ]),
  /**
   * @property {Simplate}
   * HTML that defines a new tab list
   */
  tabListTemplate: new Simplate([
    '<div class="tab-container horizontal" data-dojo-attach-point="tabContainer">',
    '<ul class="tab-list" data-dojo-attach-point="tabList">',
    '</ul>',
    '<div>',
  ]),
  /**
   * @property {Simplate}
   * HTML that defines a new tab to be placed in the tab list
   *
   */
  tabListItemTemplate: new Simplate([
    '<li class="tab" role="presentation">',
    '<a href="#{%: $$.id %}_{%: $.name %}">{%: ($.title || $.options.title) %}</a>',
    '</li>',
  ]),
  /**
   * @property {li}
   * Current tab (html element li) that the view is on
   */
  currentTab: null,
  /**
   * @property {int}
   * int value representing the index at which the default tab is located
   */
  defaultTabIndex: null,
  /**
   * @property {Array}
   * Mapping of tab to the section
   */
  tabMapping: null,
  /**
   * @property {Array}
   * Array holding the tab dom elements
   */
  tabs: null,

  _sohoTabs: null,
  /**
   * Sets the parentNode for the tabList
   */
  placeTabList: function placeTabList(parentNode = {}) {
    if (!this.tabContainer.parentNode && this.isTabbed) {
      this.tabMapping = [];
      this.tabs = [];
      $(parentNode).html(this.tabContainer);
    }
    return this;
  },
  /**
   * Function used to create the tabs, should be called by the parent upon completion of populating the tabs array of dom objects
   * @param {Array} An array of the tab objects.
  */
  createTabs: function createTabs(tabs = []) {
    $(tabs).each((i, tab) => {
      $(this.tabList).append(tab);
    });
    const tempTabs = $(this.tabContainer).tabs();
    this._sohoTabs = tempTabs.data('tabs');
    return this;
  },
  /**
   * Function used to clear the tabs, should be called by the parent on it's clear call
  */
  clearTabs: function clearTabs() {
    if (this.tabList && this.tabs) {
      this._sohoTabs.destroy();
      $(this.tabList).empty();
      $('.detailContent', this.tabContainer).remove();
    }
    if (this.tabMapping) {
      this.tabs = [];
      this.tabMapping = [];
      this.tabMoreIndex = null;
    }
    return this;
  },
});

export default __class;
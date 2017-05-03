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
 * @class argos.GroupedList
 * Grouped List provides a hook for grouping rows before rendering them to the page.
 * The grouping adds a container for the set of rows and is collapsible.
 * Note that it constructs the page sequentially meaning the rows should be in the correct
 * order before attempting to group.
 * @extends argos.List
 * @alternateClassName GroupedList
 */
import * as declare from 'dojo/_base/declare';
import * as string from 'dojo/string';
import List from './List';
import Utility from './Utility';


const __class = declare('argos.GroupedList', [List], {
  accordion: null,

  /**
   * @property {Simplate}
   * Simplate that defines the HTML Markup. This override adds the needed styling.
   */
  widgetTemplate: new Simplate([
    '<div id="{%= $.id %}" title="{%= $.titleText %}" class="list grouped-list listview-search {%= $.cls %}" {% if ($.resourceKind) { %}data-resource-kind="{%= $.resourceKind %}"{% } %}>', // tslint:disable-line
    '<div data-dojo-attach-point="searchNode"></div>',
    '{%! $.emptySelectionTemplate %}',
    '<div class="accordion panel inverse has-icons" data-dojo-attach-point="contentNode"></div>',
    '{%! $.moreTemplate %}',
    '{%! $.listActionTemplate %}',
    '</div>',
  ]),
  /**
   * @property {Simplate}
   * Simplate that defines the Group template that includes the header element with collapse button and the row container
   */
  groupTemplate: new Simplate([`
      <div class="accordion-header" role="presentation">
        <a href="#" role="button"><span>{%: $.title %}</span></a>
      </div>
      <div class="accordion-pane" data-group="{%= $.tag %}">
      </div>
    `,
  ]),

  /**
   * @property {Simplate}
   * The template used to render the pager at the bottom of the view.  This template is not directly rendered, but is
   * included in {@link #viewTemplate}.
   *
   * The default template uses the following properties:
   *
   *      name                description
   *      ----------------------------------------------------------------
   *      moreText            The text to display on the more button.
   *
   * The default template exposes the following actions:
   *
   * * more
   */
  moreTemplate: new Simplate([
    '<div class="list-more" data-dojo-attach-point="moreNode">',
    '<p class="list-remaining"><span data-dojo-attach-point="remainingContentNode"></span></p>',
    '<button class="btn" data-action="more">',
    '<span>{%= $.moreText %}</span>',
    '</button>',
    '</div>',
  ]),
  /**
   * @property {Object}
   * The current group object that is compared to the next entries group object
   * Must have a `tag` property that identifies the group.
   * The `title` property will be placed into the `groupTemplate` for the header text.
   */
  _groupBySections: null,
  _currentGroupBySection: null,
  /**
   * Function that returns a "group object". The group object must have a tag property that is
   * based off the passed entry as it will be used to compare to other entries.
   * The title should also reflect the current entry as it will be used for the header text in the group splitter.
   *
   * An example for a Yellow Page type list:
   *
   * `entryA = {first: 'Henry', last: 'Smith', phone: '123'}`
   * `entryB = {first: 'Mary', last: 'Sue', phone: '345'}`
   *
   *     groupGroupForEntry: function(entry) {
   *         var lastInitial = entry.last.substr(0,1).toUppperCase();
   *         return {
   *             tag: lastInitial,
   *             title: lastInitial
   *         };
   *     }
   *
   * @template
   * @param {Object} entry The current entry being processed.
   * @return {Object} Object that contains a tag and title property where tag will be used in comparisons
   */
  getGroupForEntry: function getGroupForEntry(entry) {
    if (this._currentGroupBySection) {
      let title;
      const sectionDef = this._currentGroupBySection.section.getSection(entry);
      if (this._currentGroupBySection.description) {
        title = `${this._currentGroupBySection.description}: ${sectionDef.title}`;
      } else {
        title = sectionDef.title;
      }
      return {
        tag: sectionDef.key,
        title,
        collapsed: !!sectionDef.collapsed,
      };
    }

    return {
      tag: 1,
      title: 'Default',
    };
  },
  /**
   * Overwrites the parent {@link List#processFeed processFeed} to introduce
   * grouping by group tags, see {@link #getGroupForEntry getGroupForEntry}.
   * @param {Object} feed The SData feed result
   * @deprecated Use processData instead
   */
  processFeed: function processFeed(feed) {
    const getGroupsNode = Utility.memoize(this.getGroupsNode.bind(this), (entryGroup) => {
      return entryGroup.tag;
    });

    if (!this.feed) {
      this.set('listContent', '');
    }

    this.feed = feed;

    if (this.feed.$totalResults === 0) {
      this.set('listContent', this.noDataTemplate.apply(this));
    } else if (feed.$resources) {
      for (let i = 0; i < feed.$resources.length; i++) {
        const entry = feed.$resources[i];
        const entryGroup = this.getGroupForEntry(entry);

        entry.$groupTag = entryGroup.tag;
        entry.$groupTitle = entryGroup.title;

        this.entries[entry.$key] = entry;
        const rowNode = $(this.rowTemplate.apply(entry, this));
        this.onApplyRowTemplate(entry, rowNode.get(0));
        $(getGroupsNode(entryGroup)).append(rowNode);
      }
    }

    // todo: add more robust handling when $totalResults does not exist, i.e., hide element completely
    if (typeof this.feed.$totalResults !== 'undefined') {
      const remaining = this.feed.$totalResults - (this.feed.$startIndex + this.feed.$itemsPerPage - 1);
      this.set('remainingContent', string.substitute(this.remainingText, [remaining]));
    }

    $(this.domNode).toggleClass('list-has-more', this.hasMoreData());
    this.updateSoho();
  },
  processData: function processData(entries) {
    const count = entries.length;
    const store = this.get('store');
    const getGroupsNode = Utility.memoize(this.getGroupsNode.bind(this), (entryGroup) => {
      return entryGroup.tag;
    });

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const entry = this._processEntry(entries[i]);
        this.entries[store.getIdentity(entry)] = entry;

        const entryGroup = this.getGroupForEntry(entry);

        entry.$groupTag = entryGroup.tag;
        entry.$groupTitle = entryGroup.title;

        const rowNode = $(this.rowTemplate.apply(entry, this));
        this.onApplyRowTemplate(entry, rowNode.get(0));

        $(getGroupsNode(entryGroup)).append(rowNode);
      }
    }
    this.updateSoho();
  },
  getGroupsNode: function getGroupsNode(entryGroup) {
    let results = $(`[data-group="${entryGroup.tag}"]`, this.contentNode);
    if (results.length > 0) {
      results = results;
    } else {
      // Does not exist, lets create it
      results = $(this.groupTemplate.apply(entryGroup, this));
      $(this.contentNode).append(results);
      // re-query what we just place in (which was a doc frag)
      results = $(`[data-group="${entryGroup.tag}"]`, this.contentNode);
    }

    return results.get(0);
  },
  /**
   * Called on application startup to configure the search widget if present and create the list actions.
   */
  startup: function startup() {
    this.inherited(arguments);
    this._initGroupBySections();
  },
  _initGroupBySections: function _initGroupBySections() {
    this._groupBySections = this.getGroupBySections();
    this.setDefaultGroupBySection();
    this.applyGroupByOrderBy();
  },
  setDefaultGroupBySection: function setDefaultGroupBySection() {
    let count = 0;
    if (this._groupBySections) {
      count = this._groupBySections.length;
      for (let i = 0; i < count; i++) {
        if (this._groupBySections[i].isDefault === true) {
          this._currentGroupBySection = this._groupBySections[i];
        }
      }
      if ((this._currentGroupBySection === null) && (count > 0)) {
        this._currentGroupBySection = this._groupBySections[0];
      }
    }
  },
  getGroupBySection: function getGroupBySection(sectionId) {
    let groupSection = null;
    if (this._groupBySections) {
      for (let i = 0; i < this._groupBySections.length; i++) {
        if (this._groupBySections[i].Id === sectionId) {
          groupSection = this._groupBySections[i];
        }
      }
    }
    return groupSection;
  },
  setCurrentGroupBySection: function setCurrentGroupBySection(sectionId) {
    this._currentGroupBySection = this.getGroupBySection(sectionId);
    this.applyGroupByOrderBy(); // need to refresh view
  },
  getGroupBySections: function getGroupBySections() {
    return null;
  },
  applyGroupByOrderBy: function applyGroupByOrderBy() {
    if (this._currentGroupBySection) {
      this.queryOrderBy = this._currentGroupBySection.section.getOrderByQuery();
    }
  },
  initSoho: function initSoho() {
    const accordion = $('.accordion.panel', this.domNode);
    accordion.accordion();
    this.accordion = accordion.data('accordion');
  },
  updateSoho: function updateSoho() {
    if (this.accordion) {
      this.accordion.updated();
    }
  },
});

export default __class;

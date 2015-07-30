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
 * @class argos.Modal
 * @alternateClassName Pop-up
 * Recommended order of function chaining to reduce errors:
 *  If fresh creation - Create -> Backdrop? -> Place -> Set -> Show
 *  If on old modal with new content - Empty -> Set -> Show
 *  If on old modal with no new content - Show
 *  To hide modal - Hide
 */
import declare from 'dojo/_base/declare';
import lang from 'dojo/_base/lang';
import event from 'dojo/_base/event';
import connect from 'dojo/_base/connect';
import domConstruct from 'dojo/dom-construct';
import domClass from 'dojo/dom-class';
import query from 'dojo/query';
import _Widget from 'dijit/_Widget';
import _Templated from 'argos/_Templated';

var __class = declare('argos.Modal', [_Widget, _Templated], {
  widgetTemplate: new Simplate([
    '<div id="{%= $.id %}" class="modal panel" data-dojo-attach-point="modalNode"></div>'
  ]),
  modalBackdropTemplate: new Simplate([
    '<div class="modal-backdrop" style="height: {%= $.parentHeight %}"></div>'
  ]),
  pickListStartTemplate: new Simplate([
    '<ul class="picklist dropdown">'
  ]),
  pickListEndTemplate: new Simplate([
    '</ul>',
  ]),
  pickListItemTemplate: new Simplate([
    '<li class="listItem">{%= $.item %}</li>'
  ]),

  id: 'modal-template',
  _orientation: null,
  _parentNode: null,
  _contentObject: null,
  _backdrop: null,
  showBackdrop: true,
  positioning: 'center',

  calculatePosition: function({ offsetTop, offsetLeft, offsetRight, offsetWidth, offsetHeight }) {
    const position = {};

    switch(this.positioning) {
      case 'right':
        position.top = offsetTop + offsetHeight;
        position.left = offsetLeft - this.modalNode.offsetWidth + offsetWidth;
      break;
      case 'left':
        position.top = offsetTop + offsetHeight;
        position.left = offsetRight + this.modalNode.offsetWidth - offsetWidth;
      break;
      case 'center':
        position.top = (this._parentNode.offsetHeight / 2) + this._parentNode.scrollTop - (this.modalNode.offsetHeight / 2);
        position.left = this._parentNode.offsetWidth / 2 - this.modalNode.offsetWidth / 2;
      break;
      default:
        position.top = (this._parentNode.offsetHeight / 2) + this._parentNode.scrollTop - (this.modalNode.offsetHeight / 2);
        position.left = this._parentNode.offsetWidth / 2 - this.modalNode.offsetWidth / 2;
    }

    if (position.top + this.modalNode.offsetHeight >= this._parentNode.scrollHeight) {
      position.top = position.top - this.modalNode.offsetHeight - offsetHeight;
    }

    //this.modalNode.style.maxHeight =  this._parentNode.offsetHeight - this._parentNode.offsetTop - offsetTop + 'px';
    this.modalNode.style.top = position.top + 'px';
    this.modalNode.style.left = position.left + 'px';
    this.modalNode.style.visibility = 'visible';
    return this;
  },
  emptyModal: function() {
    domConstruct.empty(this.modalNode);
    return this;
  },
  hideModal: function(params = {}) {
    this.toggleBackdrop()
        .toggleParentScroll();
    this.modalNode.style.visibility = 'hidden';
    return this;
  },
  noBackdrop: function() {
    this.showBackdrop = false;
    return this;
  },
  placeBackdrop: function(parentPanel = {}) {
    if (this.showBackdrop) {
      let existingBackdrop = query('.modal-backdrop', parentPanel)[0];
      if (!existingBackdrop) {
        this._backdrop = domConstruct.toDom(this.modalBackdropTemplate.apply({ parentHeight: parentPanel.scrollHeight + 'px' }));
        this._backdrop.style.visibility = 'hidden';
        domConstruct.place(this._backdrop, parentPanel);
        connect.connect(this._backdrop, "onclick", this, this.hideModal);
      }
    }
    return this;
  },
  placeModal: function(parentPanel = {}) {
    this._parentNode = parentPanel;
    this.placeBackdrop(parentPanel);
    this._orientation = connect.subscribe('/app/setOrientation', this, this.hideModal);
    domConstruct.place(this.modalNode, parentPanel);
    return this;
  },
  setContent: function(object = {}) {
    this._contentObject = object;
    domConstruct.place(object.domNode, this.modalNode);
    return this;
  },
  setContentPicklist: function(items = {}) {
    const pickListStart = domConstruct.toDom(this.pickListStartTemplate.apply()),
          pickListEnd = domConstruct.toDom(this.pickListEndTemplate.apply());

    for (let item in items) {
      domConstruct.place(this.pickListItemTemplate.apply(item, this), pickListStart);
    }
    domConstruct.place(pickListEnd, pickListStart);
    domConstruct.place(pickListStart, this.modalNode);
    return this;
  },
  showModal: function(target = {}) {
    if (this._parentNode) {
      this.toggleBackdrop()
          .toggleParentScroll()
          .calculatePosition(target);
    }
    return this;
  },
  toggleBackdrop: function() {
    if (this.showBackdrop) {
      if (this._backdrop) {
        if (this._backdrop.style.visibility === 'hidden') {
          this._backdrop.style.visibility = 'visible';
        } else {
          this._backdrop.style.visibility = 'hidden';
        }
      }
    }
    return this;
  },
  toggleParentScroll: function() {
    if (this.positioning === 'center') {
      if (this._parentNode.style.overflow === 'hidden') {
        this._parentNode.style.overflow = '';
      } else {
        this._parentNode.style.overflow = 'hidden';
      }
    }
    return this;
  }
});

lang.setObject('Sage.Platform.Mobile.Modal', __class);
export default __class;

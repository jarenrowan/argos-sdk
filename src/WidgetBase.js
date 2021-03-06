/* Copyright 2017 Infor
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable */ // TODO: Remove this later

class WidgetBase {
  constructor(options = {}) {
    this.id = options.id || 'generic_widgetbase';
    this.srcNodeRef = null;
    this.domNode = null;
    this.containerNode = null;
    this.ownerDocument = null;
    this.title = '';
    this._started = false;
  }

  initSoho() {
  }

  updateSoho() {
  }

  get(prop) {
    console.warn(`Attempting to get ${prop}`);
  }

  set(prop, val) {
    console.warn(`Attempting to set ${prop} to ${val}`);
  }

  subscribe() {
    console.warn('subscribe is deprecated.');
  }

  postscript(params, srcNodeRef) {
    this.create(params, srcNodeRef);
  }

  create(params, srcNodeRef) {
    this.srcNodeRef = $(srcNodeRef);
    this.params = params;
    this.postMixInProperties();

    const srcNodeRefDom = this.srcNodeRef.get(0);
    this.ownerDocument = this.ownerDocument || (srcNodeRefDom ? srcNodeRefDom.ownerDocument : document);

    this.buildRendering();
    this.postCreate();
  }

  postMixInProperties() {
  }

  buildRendering() {
    let root = null;
    if (this.widgetTemplate && this.widgetTemplate.constructor === Simplate) {
      const templateString = this.widgetTemplate.apply(this);
      root = $(templateString, this.ownerDocument);
    } else if (typeof this.widgetTemplate === 'string') {
      root = $(this.widgetTemplate, this.ownerDocument);
    } else if (this.widgetTemplate instanceof HTMLElement) {
      root = $(this.widgetTemplate).clone();
    }

    if (root.length > 1) {
      root.wrap('<div></div>');
    }

    this.domNode = root.get(0);
  }

  postCreate() {
  }

  startup() {
  }

  resize() {
  }

  destroy(preserveDom) {
  }

  destroyRecursive(preserveDom) {
  }

  destroyRendering(preserveDom) {
  }

  destroyDescendants(preserveDom) {
  }

  uninitialize() {
  }

  toString() {
  }

  getChildren() {
  }

  getParent() {
  }

  placeAt(reference, position) {
  }
}

export default WidgetBase;

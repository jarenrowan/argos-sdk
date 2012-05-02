define('Sage/Platform/Mobile/_UiComponent', [
    'require',
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/lang',
    'dojo/_base/connect',
    'dojo/dom-construct',
    'dijit/_WidgetBase',
    'dijit/_Container',
    './_Component'
], function(
    require,
    declare,
    array,
    lang,
    connect,
    domConstruct,
    _WidgetBase,
    _Container,
    _Component
) {
    var _UiComponent = declare('Sage.Platform.Mobile._UiComponent', [_Component], {
        _startupComponent: function(instance) {
            if (instance.isInstanceOf(_WidgetBase) && instance._started) return;

            instance.startup();
        },
        _destroyComponent: function(instance) {
            if (instance.isInstanceOf(_WidgetBase) && instance._beingDestroyed) return;

            instance.destroy();
        },
        _instantiateComponent: function(component) {
            var content = component.content,
                tag = component.tag;

            if (content || tag)
            {
                var node = content
                    ? domConstruct.toDom(lang.isFunction(content) ? content.call(this, this) : content)
                    : domConstruct.create(component.tag, component.attrs);

                return component.domOnly
                    ? new DomContentComponent(lang.mixin({components: component.components}, component.props), node)
                    : new ContentComponent(lang.mixin({components: component.components}, component.props), node);
            }

            return this.inherited(arguments);
        },
        _attachComponent: function(component, instance, root, owner) {
            this.inherited(arguments);

            if (instance.isInstanceOf(_WidgetBase))
            {
                /* place the component (widget) locally, instead of on the owner like other attachments, since
                 * it is expected that ui components (widgets) exist inside of their defined container.
                 */
                if (this.isInstanceOf(_Container))
                    this.addChild(instance, component.position);
                else if (this.isInstanceOf(_WidgetBase))
                    instance.placeAt(this.containerNode || this.domNode, component.position);
            }
            else if (instance.isInstanceOf(DomContentComponent))
            {
                if (this.isInstanceOf(_WidgetBase))
                    domConstruct.place(instance.domNode, this.containerNode || this.domNode, component.position);
                else if (this.isInstanceOf(DomContentComponent))
                    domConstruct.place(instance.domNode, this.containerNode || this.domNode, component.position);
            }
        }
    });

    var ContentComponent = declare('Sage.Platform.Mobile.ContentComponent', [_WidgetBase, _UiComponent], {});
    var DomContentComponent = declare('Sage.Platform.Mobile.DomContentComponent', [_UiComponent], {
        domNode: null,
        constructor: function(props, node) {
            lang.mixin(this, props);

            this.domNode = node;
        },
        destroy: function() {
            if (this.domNode)
            {
                if (this.domNode.parentNode)
                    this.domNode.parentNode.removeChild(this.domNode);

                this.domNode = null;
            }

            this.inherited(arguments);
        }
    });

    _UiComponent.ContentComponent = ContentComponent;
    _UiComponent.DomContentComponent = DomContentComponent;

    return _UiComponent;
});
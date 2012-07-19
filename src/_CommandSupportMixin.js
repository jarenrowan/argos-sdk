define('Sage/Platform/Mobile/_CommandSupportMixin', [
    'dojo/_base/declare',
    'dojo/dom-attr',
    'dojo/topic',
    './Utility',
    'argos!scene'
], function(
    declare,
    domAttr,
    topic,
    utility,
    scene
) {
    /* todo: convert toolbar to use this */
    return declare('Sage.Platform.Mobile._CommandSupportMixin', null, {
        _commandsByName: null,
        _commands: null,

        context: null,

        _getContextAttr: function() {
            if (this.context) return this.context;

            return this;
        },
        _setContextAttr: function(value) {
            this.context = value;
        },
        invoke: function(evt, node) {
            var name = typeof evt === 'string'
                    ? evt
                    : node && domAttr.get(node, 'data-command'),
                command = this._commandsByName[name];

            this._invokeCommand(command);
        },
        _invokeCommand: function(command) {
            var context = this.get('context'),
                scope = command.scope || context || command,
                args = utility.expand(command, command.args, context, command) || [];

            if (command.fn)
            {
                command.fn.apply(scope, args.concat(context, command));
            }
            else if (command.show)
            {
                scene().showView(command.show, args);
            }
            else if (command.action)
            {
                var method = scope && scope[command.action];

                if (typeof method === 'function') method.apply(scope, args.concat(context, command));
            }
            else if (command.publish)
            {
                topic.publish.apply(topic, [command.publish].concat(args, context, command));
            }
        }
    });
});
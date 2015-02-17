define('tests/Fields/NoteFieldTests', ['dojo/dom-attr','argos/Fields/NoteField'], function(domAttr, NoteField) {
return describe('Sage.Platform.Mobile.Fields.NoteField', function() {

    xit('Can format value with custom noteProperty getter', function() {
        var field = new NoteField();

        field.noteProperty = 'test';

        var formatted = field.formatValue({test: 'testvalue'});

        expect(formatted).toEqual('testvalue');
    });
    xit('Can return unformatted value with no noteProperty defined', function() {
        var field = new NoteField();

        field.noteProperty = null;

        var formatted = field.formatValue('testvalue');

        expect(formatted).toEqual('testvalue');
    });

    xit('Can get current value', function() {
        var field = new NoteField();

        field.currentValue = 'test';

        expect(field.getValue()).toEqual('test');
    });

    xit('Can set text of input', function() {
        var field = new NoteField();

        field.setText('test');

        expect(domAttr.get(field.inputNode, 'innerHTML')).toEqual('test');
    });

    xit('Can set currentValue from currentValue.Notes when noteProperty not defined', function() {
        var field = new NoteField();

        var getValuesFromView = function() {
            this.currentValue = {Notes: 'test'};
            this.validationValue = {Notes: 'test'};
        };

        spyOn(Sage.Platform.Mobile.Fields.NoteField.superclass, 'getValuesFromView').andCallFake(getValuesFromView);

        field.noteProperty = null;

        field.getValuesFromView();

        expect(field.currentValue).toEqual('test');
    });
    xit('Can set validationValue from validationValue.Notes when noteProperty not defined', function() {
        var field = new NoteField();

        var getValuesFromView = function() {
            this.currentValue = {Notes: 'test'};
            this.validationValue = {Notes: 'test'};
        };

        spyOn(Sage.Platform.Mobile.Fields.NoteField.superclass, 'getValuesFromView').andCallFake(getValuesFromView);

        field.noteProperty = null;

        field.getValuesFromView();

        expect(field.validationValue).toEqual('test');
    });

    xit('Can delete entityName from nav options', function() {
        var field = new NoteField();

        var options = field.createNavigationOptions();

        expect(typeof options['entityName']).toEqual('undefined');
    });

    xit('Can set nav options title to field title', function() {
        var field = new NoteField();

        field.title = 'test';

        var options = field.createNavigationOptions();

        expect(options['title']).toEqual('test');
    });

    xit('Can set nav options entry to options.entry.Notes when noteProperty is null', function() {
        var field = new NoteField();

        spyOn(Sage.Platform.Mobile.Fields.NoteField.superclass, 'createNavigationOptions').andReturn({
            entry: 'test',
            changes: 'test'
        });

        field.noteProperty = null;

        var options = field.createNavigationOptions();

        expect(options.entry['Notes']).toEqual('test');
    });
    xit('Can set nav options changes to options.changes.Notes when noteProperty is null', function() {
        var field = new NoteField();

        spyOn(Sage.Platform.Mobile.Fields.NoteField.superclass, 'createNavigationOptions').andReturn({
            entry: 'test',
            changes: 'test'
        });

        field.noteProperty = null;

        var options = field.createNavigationOptions();

        expect(options.changes['Notes']).toEqual('test');
    });

});
});

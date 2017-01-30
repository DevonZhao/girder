import WidgetModel from 'girder_plugins/item_tasks/models/WidgetModel';
import WidgetCollection from 'girder_plugins/item_tasks/collections/WidgetCollection';
import ControlsPanel from 'girder_plugins/item_tasks/views/ControlsPanel';
import View from 'girder/views/View';

import template from '../templates/candelaParameters.pug';
import '../stylesheets/candelaParameters.styl';

const CandelaParametersView = View.extend({
    events: {
        'click .g-candela-update-vis': 'updateVisualization'
    },

    initialize: function (settings) {
        this._inputWidgets = new WidgetCollection();
        this._inputsPanel = new ControlsPanel({
            title: 'Visualization options',
            collection: this._inputWidgets,
            parentView: this
        });
    },

    setData: function (data, columns) {
        this._data = data;
        this._columns = ['(none)'].concat(columns);
        this._multiColumns = this._columns.slice(1);
        this._numericColumns = ['(none)'].concat(
            this._columns.filter(d => this._data.__types__[d] === 'number'));
        this._multiNumericColumns = this._numericColumns.slice(1);
        this.render();
    },

    setComponent: function (component) {
        this._component = component;
        this.render();
    },

    render: function () {
        if (!this._data) {
            return;
        }
        if (!this._component) {
            return;
        }

        this._inputWidgets.reset();

        // Build all the widget models from the vis spec
        this._component.options.forEach((input) => {
            if (['string', 'string_list'].includes(input.type)) {
                let values = null;
                let type = null;
                let value = null;
                let numeric = !input.domain.fieldTypes.includes('string');
                if (input.type === 'string') {
                    values = numeric ? this._numericColumns : this._columns;
                    type = 'string-enumeration';
                    value = '(none)';
                } else if (input.type === 'string_list') {
                    values = numeric ? this._multiNumericColumns : this._multiColumns;
                    type = 'string-enumeration-multiple';
                    value = [];
                }
                this._inputWidgets.add(new WidgetModel({
                    type: type,
                    title: input.name || input.id,
                    id: input.id || input.name,
                    description: input.description || '',
                    values: values,
                    value: value
                }));
            }
        });

        this.$el.html(template());

        this._inputsPanel.setElement(this.$('.g-candela-inputs-container')).render();
    },

    /**
     * Validates that all of the widgets are in a valid state. Displays any
     * invalid states.
     */
    validate: function () {
        let ok = true;
        const test = (model) => {
            if (!model.isValid()) {
                ok = false;
            }
        };

        // Don't short-circuit; we want to highlight *all* invalid inputs
        this._inputWidgets.each(test);

        return ok;
    },

    /**
     * Translates the WidgetCollection state for the input widgets into the
     * appropriate Candela options, then shows the visualization.
     */
    updateVisualization: function (e) {
        if (!this.validate()) {
            this.$('.g-candela-validation-failed-message').text(
                'One or more of your inputs or s is invalid, they are highlighted in red.');
            return;
        }
        this.$('.g-candela-validation-failed-message').empty();

        let inputs = {};
        this._inputWidgets.each((model) => {
            if (model.value() !== '(none)') {
                inputs[model.id] = model.value();
            }
        });
        inputs.data = this._data;

        let vis = new this._component(this.$('.g-candela-vis')[0], inputs);
        vis.render();
    }
});

export default CandelaParametersView;

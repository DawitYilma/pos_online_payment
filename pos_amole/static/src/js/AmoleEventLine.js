odoo.define('pos_amole.AmoleEventLine', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class AmoleEventLine extends PosComponent {
        get highlight() {
            return this.props.partner !== this.props.selectedClient ? '' : 'highlight';
        }
    }
    AmoleEventLine.template = 'AmoleEventLine';

    Registries.Component.add(AmoleEventLine);

    return AmoleEventLine;
});

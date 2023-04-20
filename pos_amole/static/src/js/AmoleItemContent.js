odoo.define('pos_amole.AmoleItemContent', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class AmoleItemContent extends PosComponent {
        get highlight() {
            return this.props.partner !== this.props.selectedClient ? '' : 'highlight';
        }
    }
    AmoleItemContent.template = 'AmoleItemContent';

    Registries.Component.add(AmoleItemContent);

    return AmoleItemContent;
});

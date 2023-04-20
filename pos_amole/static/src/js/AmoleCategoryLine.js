odoo.define('pos_amole.AmoleCategoryLine', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class AmoleCategoryLine extends PosComponent {
        get highlight() {
            return this.props.partner !== this.props.selectedClient ? '' : 'highlight';
        }
    }
    AmoleCategoryLine.template = 'AmoleCategoryLine';

    Registries.Component.add(AmoleCategoryLine);

    return AmoleCategoryLine;
});

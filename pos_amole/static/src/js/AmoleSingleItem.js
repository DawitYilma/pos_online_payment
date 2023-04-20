odoo.define('pos_amole.AmoleSingleItem', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    class AmoleSingleItem extends PosComponent {
        fetchUssdIp(event) {
            console.log('Fetch');
            this.trigger('fetch-otp-ip', event.target.value);
        }
        updatePhoneNumber(event) {
            console.log('Update');
            this.trigger('fetch-ussd-ip', event.target.value);
        }
    }
    AmoleSingleItem.template = 'AmoleSingleItem';

    Registries.Component.add(AmoleSingleItem);

    return AmoleSingleItem;
});

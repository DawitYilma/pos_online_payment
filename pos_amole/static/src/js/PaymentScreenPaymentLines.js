odoo.define('pos_amole.PaymentLinesPosAmole', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');
    const PaymentScreenPaymentLines = require('point_of_sale.PaymentScreenPaymentLines');

    const { useRef, useContext } = owl.hooks;
    const { parse } = require('web.field_utils');
    const { useErrorHandlers } = require('point_of_sale.custom_hooks');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const { useListener } = require('web.custom_hooks');
    const { onChangeOrder } = require('point_of_sale.custom_hooks');

    const PaymentLinesPosAmole = (PaymentScreenPaymentLines) =>
        class extends PaymentScreenPaymentLines {
            constructor() {
                super(...arguments);
                const order = this.env.pos.get_order();
                this.orderUiState = useContext(order.uiState.PaymentScreen);
                this.orderUiState.inputUssdIp = this.orderUiState.inputUssdIp;
            }
            fetchUssdIp(event) {
                this.trigger('fetch-ussd-ip', event.target.value);
            }
        }
        Registries.Component.extend(PaymentScreenPaymentLines, PaymentLinesPosAmole);

        return PaymentScreenPaymentLines;
    });
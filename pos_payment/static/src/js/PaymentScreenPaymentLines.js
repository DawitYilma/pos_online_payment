odoo.define('pos_payment.PaymentLinesPosPayment', function(require) {
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

    const PaymentLinesPosPayment = (PaymentScreenPaymentLines) =>
        class extends PaymentScreenPaymentLines {
            constructor() {
                super(...arguments);
                const order = this.env.pos.get_order();
                this.orderUiState = useContext(order.uiState.PaymentScreen);
                this.orderUiState.inputPhoneNumber = this.orderUiState.inputPhoneNumber;
                this.orderUiState.inputTraceNumber = this.orderUiState.inputTraceNumber
                console.log(this.orderUiState.inputPhoneNumber, 'INPUTPHONE12', this.orderUiState.inputTraceNumber);
            }
            updatePhoneNumber(event) {
                this.trigger('update-phone-number', event.target.value);
            }
            updateTraceNumber(event) {
                this.trigger('update-trace-number', event.target.value);
            }
        }
        Registries.Component.extend(PaymentScreenPaymentLines, PaymentLinesPosPayment);

        return PaymentScreenPaymentLines;
    });
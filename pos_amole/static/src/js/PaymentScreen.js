odoo.define('pos_amole.PaymentPosAmole', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');

    const { useRef, useContext } = owl.hooks;
    const { parse } = require('web.field_utils');
    const { useErrorHandlers } = require('point_of_sale.custom_hooks');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const { useListener } = require('web.custom_hooks');
    const { onChangeOrder } = require('point_of_sale.custom_hooks');

    const PaymentPosAmole = (PaymentScreen) =>
        class extends PaymentScreen {
                constructor() {
                    super(...arguments);
                    useListener('send-ussd-request', this._sendUssdRequest);
                    useListener('fetch-ussd-ip', this._fetchUssdIp);

                }

                fetchUssdIp(event) {
                    this.trigger('fetch-ussd-ip', event.target.value);
                }

                _fetchUssdIp(event) {
                    this.orderUiState.inputUssdIp = event.detail;
                    console.log('_fetchUssdIp Payment Screen')
                }

                addNewPaymentLine({ detail: paymentMethod }) {
                    console.log('addNewPaymentLine');
                    // original function: click_paymentmethods
                    if (this.currentOrder.electronic_payment_in_progress()) {
                        this.showPopup('ErrorPopup', {
                            title: this.env._t('Error'),
                            body: this.env._t('There is already an electronic payment in progress.'),
                        });
                        return false;
                    } else {
                        this.currentOrder.add_paymentline(paymentMethod);
                        NumberBuffer.reset();
                        this.payment_interface = paymentMethod.payment_terminal;
                        if (paymentMethod.use_payment_terminal === 'amole') {
                            this.currentOrder.selected_paymentline.set_payment_status('ussd');
                        }
                        else if (this.payment_interface) {
                            this.currentOrder.selected_paymentline.set_payment_status('pending');
                        }
                        return true;
                    }
                }

                async _sendUssdRequest({ detail: line }) {
                    // Other payment lines can not be reversed anymore
                    this.paymentLines.forEach(function (line) {
                        line.can_be_reversed = false;
                    });

                    const payment_terminal = line.payment_method.payment_terminal;
                    line.set_payment_status('waiting');

                    const isUssdSuccessful = await payment_terminal.send_ussd_request(line.cid);
                    if (isUssdSuccessful) {
                        line.set_payment_status('pending');
                        line.can_be_reversed = payment_terminal.supports_reversals;
                    } else {
                        line.set_payment_status('retry');
                    }
                }

            }
        Registries.Component.extend(PaymentScreen, PaymentPosAmole);

        return PaymentScreen;
});
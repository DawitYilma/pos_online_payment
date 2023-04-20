odoo.define('pos_amole.AmolePadWidget', function(require) {
    'use strict';

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');

    /**
     * @props client
     * @emits click-customer
     * @emits click-pay
     */
    class AmolePadWidget extends PosComponent {
        get _amole_fetch_event() {
            var data = {
                "code": order.uiState.PaymentScreen.state.inputUssdIp,
                "payer_id": this.payment_method.amole_app_id,
                "trace_no": trace_no,
                "amount": order.selected_paymentline.amount,
                "phone": order.uiState.PaymentScreen.state.inputPhoneNumber,
                "description": "POS PAYMENT",
            }
            return this._call_amole_event(data).then(function (data) {
                return self._amole_handle_response(data);
            });
        }
        _call_amole_event(data, operation) {
            return rpc.query({
                model: 'pos.payment.method',
                method: 'send_request_amole_event',
                args: [[this.payment_method.id], data],
            }, {
                // wait 10 seconds
                timeout: 10000,
                shadow: true,
            }).catch(this._handle_odoo_connection_failure.bind(this));
        }

        _handle_odoo_connection_failure(data) {
            // handle timeout
            this._show_error(_t('Could not connect to the Odoo server, please check your internet connection and try again.'));

            return Promise.reject(data); // prevent subsequent onFullFilled's from being called
        }
    }
    AmolePadWidget.template = 'AmolePadWidget';

    Registries.Component.add(AmolePadWidget);

    return AmolePadWidget;
});

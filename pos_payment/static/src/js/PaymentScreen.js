odoo.define('pos_payment.PaymentPosPayment', function(require) {
    'use strict';

    var core = require('web.core');
    var rpc = require('web.rpc');
    var _t = core._t;
    const { Gui } = require('point_of_sale.Gui');

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const PaymentScreen = require('point_of_sale.PaymentScreen');

    const { useRef, useContext } = owl.hooks;
    const { parse } = require('web.field_utils');
    const { useErrorHandlers } = require('point_of_sale.custom_hooks');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const { useListener } = require('web.custom_hooks');
    const { onChangeOrder } = require('point_of_sale.custom_hooks');

    const PaymentPosPayment = (PaymentScreen) =>
        class extends PaymentScreen {
                constructor() {
                    super(...arguments);
                    useListener('update-phone-number', this._updatePhoneNumber);
                    useListener('update-trace-number', this._updateTraceNumber);
                    useListener('send-trace-request', this._sendTraceNumberRequest);

                    const order = this.currentOrder;
                    this.orderUiState = useContext(order.uiState.PaymentScreen);
                    this.orderUiState.inputPhoneNumber = this.orderUiState.inputPhoneNumber;
                    this.orderUiState.inputTraceNumber = this.orderUiState.inputTraceNumber;
                    console.log(this.orderUiState.inputPhoneNumber, 'INPUTPHONE', this.orderUiState.inputTraceNumber);

                }
                async _sendTraceNumberRequest({ detail: line }){
                    console.log(line, 'LINE', this);
                    this.paymentLines.forEach(function (line) {
                        line.can_be_reversed = false;
                    });
                    var trace_no = this.orderUiState.inputTraceNumber;
                    console.log(trace_no, 'TRACE');

                    const payment_terminal = line.payment_method.payment_terminal;
                    line.set_payment_status('waiting');

                    const isTraceSuccessful = await this.send_trace_request(trace_no, line);
                    if (isTraceSuccessful) {
                        line.set_payment_status('done');
                    } else {
                        line.set_payment_status('retry');
                    }

                }
                send_trace_request(trace_no){
                    console.log(this.env.pos.get_order().selected_paymentline.payment_method.id, 'THISSS')
                    self = this;
                    var pay_meth = this.env.pos.get_order().selected_paymentline.payment_method.id
                    var order = this.env.pos.get_order();
                    console.log(pay_meth, 'METH');
                    var data = {
                        'traceNo': trace_no,
                        'payment_method': pay_meth,
                        'amount': order.selected_paymentline.amount
                    };
                    return this._call_pos_payment(data).then(function (data) {
                        return self._payment_handle_result(data);
                    });
                }

                _call_pos_payment(data, operation) {
                    console.log('_call_pos_payment');
                    return rpc.query({
                        model: 'pos.payment.method',
                        method: 'send_request_trace_no',
                        args: [[this.env.pos.get_order().selected_paymentline.payment_method.id], data],
                    }, {
                        // wait 10 seconds
                        timeout: 10000,
                        shadow: true,
                    }).catch(this._handle_odoo_connection_failure.bind(this));
                }

                _payment_handle_result(response) {
                    console.log('_amole_handle_response', response);
                    var line = this.env.pos.get_order().selected_paymentline;

                    if (response && response.msg && response.msg !== 'Success') {
                        this._show_error(_.str.sprintf(_t('An unexpected error occured: %s'), response.longMsg));
                        line.set_payment_status('retry');
                        this.render()
                    }else if (response) {
                        return true;
                    } else {
                        this.showPopup('ErrorPopup', {
                            title: this.env._t('Connection Error'),
                            body: this.env._t('Could not connect to the Odoo server, please check your internet connection and try again.'),
                        });
                        line.set_payment_status('retry');
                        this.render()
                    }
                }

                _handle_odoo_connection_failure(data) {
                    // handle timeout
                    this.showPopup('ErrorPopup', {
                        title: this.env._t('Connection Error'),
                        body: this.env._t('Could not connect to the Odoo server, please check your internet connection and try again.'),
                    });
                    return;

                }

                updatePhoneNumber(event) {
                    this.trigger('update-phone-number', event.target.value);
                }
                updateTraceNumber(event) {
                    this.trigger('update-trace-number', event.target.value);
                }
                get order() {
                    console.log(this.env.pos,'ENVVVVVVVV', this.env)
                    return this.env.pos
                }
                _updatePhoneNumber(event) {
                    this.orderUiState.inputPhoneNumber = event.detail;
                    console.log(this.orderUiState.inputPhoneNumber)
                }
                _updateTraceNumber(event) {
                    this.orderUiState.inputTraceNumber = event.detail;
                    console.log(this.orderUiState.inputTraceNumber)
                }

                _show_error(msg, title) {
                    if (!title) {
                        title =  _t('Online Payment Error');
                    }
                    Gui.showPopup('ErrorPopup',{
                        'title': title,
                        'body': msg,
                    });
                }

            }
        Registries.Component.extend(PaymentScreen, PaymentPosPayment);

        return PaymentScreen;
});
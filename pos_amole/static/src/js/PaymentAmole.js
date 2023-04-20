odoo.define('pos_amole.payment', function (require) {
"use strict";

var core = require('web.core');
var rpc = require('web.rpc');
var PaymentInterface = require('point_of_sale.PaymentInterface');
const { Gui } = require('point_of_sale.Gui');

var _t = core._t;

var PaymentAmole = PaymentInterface.extend({
    send_payment_request: function (cid) {
        this._super.apply(this, arguments);
        console.log('send_payment_request');
        this._reset_state();
        return this._amole_pay();
    },

    send_ussd_request: function (cid) {
        console.log('send_ussd_request');
        this._reset_state();
        return this._amole_ussd();
    },

    send_payment_cancel: function (order, cid) {
        this._super.apply(this, arguments);
        // set only if we are polling
        this.was_cancelled = !!this.polling;
        return this._amole_cancel();
    },
    close: function () {
        this._super.apply(this, arguments);
    },

    // private methods
    _reset_state: function () {
        this.was_cancelled = false;
        this.last_diagnosis_service_id = false;
        this.remaining_polls = 4;
        clearTimeout(this.polling);
    },

    _amole_pay: function () {
        console.log('_amole_pay')
        var self = this;
        var order = this.pos.get_order();

        if (order.selected_paymentline.amount < 0) {
            this._show_error(_t('Cannot process transactions with negative amount.'));
            return Promise.resolve();
        }

        var uid = order.uid.replace(/-/g, '')
        var config = this.pos.config;
        var random_val = Math.floor(Math.random() * 10000);
        var trace_no = random_val.toString().concat("_", uid);

        var data = {
            "code": order.uiState.PaymentScreen.state.inputUssdIp,
            "pos_session": this.pos.pos_session.config_id[0],
            "payerId": this.payment_method.amole_app_id,
            "apiKey": this.payment_method.amole_api_key,
            "trace_no": trace_no,
            "amount": order.selected_paymentline.amount,
            "phone": order.uiState.PaymentScreen.state.inputPhoneNumber,
            "description": "POS PAYMENT",
        }
        return this._call_amole(data).then(function (data) {
            return self._amole_handle_response(data);
        });
    },

    _amole_ussd: function () {
        console.log('_amole_ussd');
        var self = this;
        var order = this.pos.get_order();

        var uid = order.uid.replace(/-/g, '')
        var config = this.pos.config;
        if (order.uiState.PaymentScreen.state.inputPhoneNumber) {
            var data = {
                "description": "POS PAYMENT",
                "pos_session": this.pos.pos_session.config_id[0],
                "phone": order.uiState.PaymentScreen.state.inputPhoneNumber,
                "payerId": this.payment_method.amole_app_id,
                "apiKey": this.payment_method.amole_api_key,
            }
            return this._call_amole_ussd(data).then(function (data) {
                return self._amole_handle_ussd(data);
            });

        }
        else {
            this._show_error(_t('Cannot process transactions without phone number.'));
            return Promise.resolve();
        }

    },

    _call_amole: function (data, operation) {
        return rpc.query({
            model: 'pos.payment.method',
            method: 'send_request_amole',
            args: [[this.payment_method.id], data],
        }, {
            // wait 10 seconds
            timeout: 10000,
            shadow: true,
        }).catch(this._handle_odoo_connection_failure.bind(this));
    },

    _call_amole_ussd: function (data, operation) {
        return rpc.query({
            model: 'pos.payment.method',
            method: 'send_ussd_amole',
            args: [[this.payment_method.id], data],
        }, {
            // wait 10 seconds
            timeout: 10000,
            shadow: true,
        }).catch(this._handle_odoo_ussd_failure.bind(this));
    },

    _amole_handle_response: function (response) {
        console.log('_amole_handle_response')
        var line = this.pos.get_order().selected_paymentline;

        if (response.status_code == 401) {
            this._show_error(_t('Authentication failed. Please check your Amole credentials.'));
            line.set_payment_status('force_done');
            return Promise.resolve();
        }

        if (response.msg && response.msg !== 'Success') {
            var msg = '';

            this._show_error(_.str.sprintf(_t('An unexpected error occured. Message from Amole: %s'), response.longMsg));
            if (line) {
                line.set_payment_status('force_done');
            }

            return Promise.resolve();
        } else {

            return true;
        }
    },

    _amole_handle_ussd: function (response) {
        console.log('_amole_handle_ussd');
        var line = this.pos.get_order().selected_paymentline;

        if (response.status_code == 401) {
            this._show_error(_t('Authentication failed. Please check your Amole credentials.'));
            line.set_payment_status('ussd');
            return Promise.reject()
        }

        if (response.msg && response.msg !== 'Success') {

            this._show_error(_.str.sprintf(_t('An unexpected error occured. Message from Amole: %s'), response.longMsg));
            line.set_payment_status('ussd');

            return Promise.reject()

        } else {
            line.set_payment_status('pending');

            return true;
        }
    },

    _handle_odoo_connection_failure: function (data) {
        // handle timeout
        var line = this.pos.get_order().selected_paymentline;
        if (line) {
            line.set_payment_status('retry');
        }
        this._show_error(_t('Could not connect to the Odoo server, please check your internet connection and try again.'));

        return Promise.reject(data); // prevent subsequent onFullFilled's from being called
    },

    _handle_odoo_ussd_failure: function (data) {
        // handle timeout
        var line = this.pos.get_order().selected_paymentline;
        if (line) {
            line.set_payment_status('ussd');
        }
        this._show_error(_t('Could not connect to the Odoo server, please check your internet connection and try again.'));

        return Promise.reject(data); // prevent subsequent onFullFilled's from being called
    },

    _amole_cancel: function (ignore_error) {
        this._reset_state();
        var order = this.pos.get_order();
        var line = order.selected_paymentline;
        console.log(line, 'LINETT')
        if (line) {
            line.set_payment_status('retry');
        }
        return Promise.reject();
    },

    _show_error: function (msg, title) {
        if (!title) {
            title =  _t('Amole Error');
        }
        Gui.showPopup('ErrorPopup',{
            'title': title,
            'body': msg,
        });
    },
});

return PaymentAmole;
});

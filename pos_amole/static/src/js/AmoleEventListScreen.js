odoo.define('pos_amole.AmoleEventListScreen', function(require) {
    'use strict';

    var rpc = require('web.rpc');
    var core = require('web.core');
    const { Gui } = require('point_of_sale.Gui');

    const { debounce } = owl.utils;
    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const { useListener } = require('web.custom_hooks');
    const { isRpcError } = require('point_of_sale.utils');

    var _t = core._t;

    class AmoleEventListScreen extends PosComponent {
        constructor() {
            super(...arguments);

            useListener('click-content-type', this._onSelectContentType);
            useListener('click-category-line', this._onSelectCategory);
            useListener('click-single-item', this._onSelectSingleItem);
            useListener('send-ussd-request', this._sendUssdRequest);
            useListener('send-payment-request', this._sendOTPRequest);
            useListener('fetch-ussd-ip', this._fetchUssdIp);
            useListener('fetch-otp-ip', this._fetchOTPResponse);

            this.state = {
                query: null,
                contentTypeShown: true,
                contentCategoryShown: false,
                contentItemsShown: false,
                contentItemShown: false,
                events: this.props.events,
                phoneNumber: null,
                otpResponse: null,
                status: 'new',
                CategoryModeProps: {
                    events: {}
                },
                ItemsModeProps: {
                    events: {}
                },

                ItemModeProps: {
                    event: {}
                },
            };
            this.updateClientList = debounce(this.updateClientList, 70);
        }

        //General Actions

        set_payment_status(status) {
            this.state.status = status;
            this.render();
        }

        //USSD ACTIONS

        fetchUssdIp(event) {
            this.trigger('fetch-ussd-ip', event.target.value);
        }

        _fetchUssdIp(line) {
            this.state.phoneNumber = line;
        }

        async _sendUssdRequest() {
            self = this;
            console.log('_sendUssdRequest');
            this.set_payment_status('ussd_wait');
            const isUssdSuccessful = await this._amole_ussd(this.state.phoneNumber);
            if (isUssdSuccessful) {
                this.set_payment_status('otp');
            } else {
                this.set_payment_status('ussd_retry');
            }
        }

        _amole_ussd(phone_number) {
            self = this;
            console.log('_amole_ussd');
            if (phone_number) {
                var data = {
                    "description": "POS PAYMENT",
                    "phone": phone_number.detail,
                }
                return this._call_amole_ussd(data).then(function (data) {
                    return self._amole_handle_pay_ussd(data);
                });

            }
            else {
                this._show_error(_t('Cannot process transactions without phone number.'));
                return Promise.resolve();
            }

        }

        _call_amole_ussd(data, operation) {
            console.log('_call_amole_ussd');
            return rpc.query({
                model: 'pos.config',
                method: 'send_ussd_amole',
                args: [[this.env.pos.pos_session.config_id[0]], data],
            }, {
                // wait 10 seconds
                timeout: 10000,
                shadow: true,
            }).catch(this._handle_odoo_ussd_failure.bind(this));
        }

        _amole_handle_pay_ussd(response) {
            console.log('_amole_handle_pay_ussd')

            if (response.status_code == 401) {
                this._show_error(_t('Authentication failed. Please check your Amole credentials.'));
                self.set_payment_status('ussd_retry');
                return Promise.reject()
            }

            if (response.msg && response.msg !== 'Success') {
                this._show_error(_.str.sprintf(_t('An unexpected error occured. Message from Amole: %s'), response.longMsg));
                this.set_payment_status('ussd_retry');

                return Promise.reject()

            } else {

                this.set_payment_status('otp');

                return true;
            }
        }

        _handle_odoo_ussd_failure(data) {
            // handle timeout
            this.set_payment_status('ussd_retry');
            this._show_error(_t('Could not connect to the Odoo server, please check your internet connection and try again.'));

            return Promise.reject(data); // prevent subsequent onFullFilled's from being called
        }


        //OTP ACTIONS

        fetchOTPResponse(event) {
            this.trigger('fetch-otp-ip', event.target.value);
        }

        _fetchOTPResponse(line) {
            this.state.otpResponse = line;
        }

        async _sendOTPRequest() {
            console.log('_sendOTPRequest');
            this.set_payment_status('otp_wait');
            const isOTPSuccessful = await this._amole_pay(this.state.otpResponse);
            if (isOTPSuccessful) {
                this.set_payment_status('done');
            } else {
                this.set_payment_status('otp_retry');
            }
        }

        _amole_pay(otp) {
            self = this;
            console.log('_amole_pay');

            var random_val = Math.floor(Math.random() * 10000);
            var trace_no = random_val.toString().concat("_", this.state.ItemModeProps.event.ItemID);

            var data = {
                "code": otp.detail,
                "itemId": this.state.ItemModeProps.event.ItemID,
                "trace_no": trace_no,
                "amount": this.state.ItemModeProps.event.TotalPrice,
                "phone": this.state.phoneNumber.detail,
                "description": "POS EVENT PAYMENT",
            }
            return this._call_amole(data).then(function (data) {
                return self._amole_handle_pay_response(data);
            });
        }

        _call_amole(data, operation) {
            console.log('_call_amole');
            return rpc.query({
                model: 'pos.config',
                method: 'send_request_amole',
                args: [[this.env.pos.pos_session.config_id[0]], data],
            }, {
                // wait 10 seconds
                timeout: 10000,
                shadow: true,
            }).catch(this._handle_odoo_connection_fail.bind(this));
        }

        _amole_handle_pay_response(response) {
            self = this;
            console.log('_amole_handle_pay_response')

            if (response.status_code == 401) {
                this._show_error(_t('Authentication failed. Please check your Amole credentials.'));
                self.set_payment_status('otp_retry');
                return Promise.resolve();
            }

            if (response.msg && response.msg !== 'Success') {
                var msg = '';

                this._show_error(_.str.sprintf(_t('An unexpected error occured. Message from Amole: %s'), response.longMsg));
                self.set_payment_status('otp_retry');

                return Promise.resolve();
            } else {
                self.set_payment_status('done');

                return true;
            }
        }

        _handle_odoo_connection_fail(data) {
            // handle timeout
            this.set_payment_status('otp_retry');
            this._show_error(_t('Could not connect to the Odoo server, please check your internet connection and try again.'));

            return Promise.reject(data); // prevent subsequent onFullFilled's from being called
        }


        // Lifecycle hooks
        back() {
            this.trigger('close-temp-screen');
        }
        back_back(selected) {
            if(this.state.contentTypeShown) {
                this.trigger('close-temp-screen');
            }
            else if (this.state.contentCategoryShown){
                this.state.contentTypeShown = true;
                this.state.contentCategoryShown = false;
                this.render();
            }
            else if (this.state.contentItemsShown){
                this.state.contentCategoryShown = true;
                this.state.contentItemsShown = false;
                this.render();
            }
            else if (this.state.contentItemShown){
                this.state.contentItemsShown = true;
                this.state.contentItemShown = false;
                this.render();
            }
        }
        closeAmole() {
            this.trigger('close-temp-screen');
        }
        confirm() {
            this.props.resolve({ confirmed: true, payload: this.state.selectedClient });
            this.trigger('close-temp-screen');
        }

        //GET AMOLE EVENT/SERVICE

        get amole_content_type() {
            console.log('amole_content_type');
            if (this.state.events) {
                return this.state.events;
            } else {
                return 1;
            }
        }

        get amole_category() {
            console.log('amole_category');
            if (this.state.CategoryModeProps.events){
                return this.state.CategoryModeProps.events;
            }
            else {
                return 1;
            }
        }

        get amole_items() {
            console.log('amole_items');
            if (this.state.ItemsModeProps.events){
                return this.state.ItemsModeProps.events;
            }
            else {
                return 1;
            }
        }

        async _onSelectContentType(selected) {
            const events = await this.amole_category_line(selected);
            console.log('_onSelectContentType');
            this.state.contentTypeShown = false;
            this.state.contentCategoryShown = true;
            this.state.CategoryModeProps.events = events;
            this.render();
        }

        async _onSelectCategory(selected) {
            const events = await this.amole_items_line(selected);
            console.log('_onSelectCategory');
            this.state.contentTypeShown = false;
            this.state.contentCategoryShown = false;
            this.state.contentItemsShown = true;
            this.state.ItemsModeProps.events = events;
            this.render();
        }

        async _onSelectSingleItem(selected) {
            const event = await this.amole_item_line(selected);
            console.log('_onSelectSingleItem');
            this.state.contentTypeShown = false;
            this.state.contentCategoryShown = false;
            this.state.contentItemsShown = false;
            this.state.contentItemShown = true;
            this.state.ItemModeProps.event = event;
            this.state.status = 'ussd'
            this.render();
        }

        amole_item_line(selected) {
            console.log('amole_item_line');
            self = this;
            var data = {
                'itemId': selected.detail.selected.ItemID,
            };
            return this._call_amole_item(data).then(function (data) {
                return self._amole_handle_response(data);
            });
        }

        amole_items_line(selected) {
            self = this;
            var data = {
                'itemCategoryId': selected.detail.selected.CategoryID,
            };
            return this._call_amole_items(data).then(function (data) {
                return self._amole_handle_response(data);
            });
        }

        amole_category_line(selected) {
            console.log('amole_category_line')
            self = this;
            var data = {
                'categoryId': selected.detail.selected.ContentTypeID
            };
            return this._call_amole_category(data).then(function (data) {
                return self._amole_handle_response(data);
            });
        }

        _call_amole_category(data, operation) {
            console.log('_call_amole_category');
            return rpc.query({
                model: 'pos.config',
                method: 'send_request_amole_category',
                args: [[this.env.pos.pos_session.config_id[0]], data],
            }, {
                // wait 10 seconds
                timeout: 10000,
                shadow: true,
            }).catch(this._handle_odoo_connection_failure.bind(this));
        }

        _call_amole_items(data, operation) {
            console.log('_call_amole_items');
            return rpc.query({
                model: 'pos.config',
                method: 'send_request_amole_items',
                args: [[this.env.pos.pos_session.config_id[0]], data],
            }, {
                // wait 10 seconds
                timeout: 10000,
                shadow: true,
            }).catch(this._handle_odoo_connection_failure.bind(this));
        }

        _call_amole_item(data, operation) {
            console.log('_call_amole_item');
            return rpc.query({
                model: 'pos.config',
                method: 'send_request_amole_item',
                args: [[this.env.pos.pos_session.config_id[0]], data],
            }, {
                // wait 10 seconds
                timeout: 10000,
                shadow: true,
            }).catch(this._handle_odoo_connection_failure.bind(this));
        }

        _amole_handle_response(response) {
            console.log('_amole_handle_response');

            if (response && response.msg && response.msg !== 'Success') {
                this._show_error(_.str.sprintf(_t('An unexpected error occured. Message from Amole: %s'), response.longMsg));
            }else if (response) {
                return response.data;
            } else {
                this._show_error(_.str.sprintf(_t('An unexpected error occured. Message from Amole: %s'), response.longMsg));
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

        _show_error(msg, title) {
            if (!title) {
                title =  _t('Amole Error');
            }
            Gui.showPopup('ErrorPopup',{
                'title': title,
                'body': msg,
            });
        }
    }
    AmoleEventListScreen.template = 'AmoleEventListScreen';

    Registries.Component.add(AmoleEventListScreen);

    return AmoleEventListScreen;
});

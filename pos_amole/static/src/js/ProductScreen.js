odoo.define('pos_amole.ProductPosAmole', function(require) {
    'use strict';
    var rpc = require('web.rpc');
    var core = require('web.core');

    const PosComponent = require('point_of_sale.PosComponent');
    const Registries = require('point_of_sale.Registries');
    const ProductScreen = require('point_of_sale.ProductScreen');

    const { useRef, useContext } = owl.hooks;
    const { parse } = require('web.field_utils');
    const { useErrorHandlers } = require('point_of_sale.custom_hooks');
    const NumberBuffer = require('point_of_sale.NumberBuffer');
    const { useListener } = require('web.custom_hooks');
    const { onChangeOrder } = require('point_of_sale.custom_hooks');

    var _t = core._t;

    const ProductPosAmole = (ProductScreen) =>
        class extends ProductScreen {
                constructor() {
                    super(...arguments);
                    useListener('click-amole', this._onClickAmoleEvent);

                }

                async _onClickAmoleEvent() {
                    console.log('_onClickAmoleEvent');
                    const events = await this.amole_content();
                    const event_log = this.showTempScreen('AmoleEventListScreen', { events: events });
                }

                amole_content() {
                    self = this;
                    var data = {};
                    return this._call_amole_event(data).then(function (data) {
                        return self._amole_handle_response(data);
                    });
                }

                _call_amole_event(data, operation) {
                    console.log('_call_amole_event');
                    return rpc.query({
                        model: 'pos.config',
                        method: 'send_request_amole_event',
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
                        this.showPopup('ErrorPopup', {
                            title: this.env._t('Connection Error'),
                            body: this.env._t('Could not connect to the Odoo server, please check your internet connection and try again.'),
                        });
                    }else if (response) {
                        return response.data;
                    } else {
                        this.showPopup('ErrorPopup', {
                            title: this.env._t('Connection Error'),
                            body: this.env._t('Could not connect to the Odoo server, please check your internet connection and try again.'),
                        });
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

            }
        Registries.Component.extend(ProductScreen, ProductPosAmole);

        return ProductScreen;
});
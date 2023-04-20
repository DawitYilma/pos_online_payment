odoo.define('pos_amole.models', function (require) {
const { Context } = owl;
var models = require('point_of_sale.models');
var PaymentAmole = require('pos_amole.payment');

models.register_payment_method('amole', PaymentAmole);
models.load_fields('pos.payment.method', ['amole_app_id', 'amole_trace_no', 'amole_payment', 'amole_api_key']);
models.load_fields('pos.config', ['amole_event']);

var _super_order = models.Order.prototype;

});

odoo.define('pos_payment.models', function (require) {
const { Context } = owl;
var models = require('point_of_sale.models');

models.load_fields('pos.order', ['trace_no']);

var _super_order = models.Order.prototype;

models.Order =  models.Order.extend({
    initialize: function(attr, options) {
        _super_order.initialize.call(this,attr,options);
        _super_order.initialize.apply(this, arguments);
        this.uiState = {
            ReceiptScreen: new Context({
                inputEmail: '',
                // if null: not yet tried to send
                // if false/true: tried sending email
                emailSuccessful: null,
                emailNotice: '',
            }),
            TipScreen: new Context({
                inputTipAmount: '',
            }),
            PaymentScreen: new Context({
                inputPhoneNumber: '',
                inputTraceNumber: '',
            }),
        };

    },
    export_as_JSON: function() {
        var json = _super_order.export_as_JSON.apply(this, arguments);
        var order = this.pos.get('selectedOrder');
        if (order) {
            if(this.uiState.PaymentScreen){
                json.field_trace_no = this.uiState.PaymentScreen.state.inputTraceNumber;
            }
        }
        return json
    },

});

});

from odoo import fields, models, api, _

import logging

from functools import partial

_logger = logging.getLogger(__name__)


class PosOrder(models.Model):
    _inherit = 'pos.order'

    trace_no = fields.Char('Trace No')
    payer_id = fields.Char('Payer ID')

    @api.model
    def _order_fields(self, ui_order):
        res = super(PosOrder, self)._order_fields(ui_order)
        print(ui_order, 'UI')
        if 'field_trace_no' in ui_order:
            res['trace_no'] = ui_order['field_trace_no']
        else:
            res['trace_no'] = False
        return res
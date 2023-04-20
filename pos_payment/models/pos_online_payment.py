from odoo import fields, models, api, _

import logging

import datetime
from odoo.http import request

_logger = logging.getLogger(__name__)


class PosOnlinePayment(models.Model):
    _name = 'pos.online.payment'
    _order = 'id desc'

    name = fields.Char('Trace Number')
    pay_method = fields.Char('Payment Method')
    payer_id = fields.Char('Payer ID')
    price= fields.Char('Price')
    pos_config = fields.Many2one('pos.config', 'POS')
    date = fields.Datetime(string='Date', readonly=True, index=True, default=fields.Datetime.now)

from odoo import fields, models, api, _


class AmolePayment(models.Model):
    _name = 'amole.payment'
    _inherit = 'mail.thread'

    name = fields.Char('Name')
    trace_no = fields.Char('Trace Number')


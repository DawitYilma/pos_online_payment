from odoo import fields, models, api, _

import logging

import json, requests

_logger = logging.getLogger(__name__)


class PosPaymentMethod(models.Model):
    _inherit = 'pos.payment.method'

    def _get_payment_terminal_selection(self):
        return super(PosPaymentMethod, self)._get_payment_terminal_selection() + [('amole', 'Amole')]

    amole_app_id = fields.Integer('APP ID')
    amole_api_key = fields.Char('API KEY')
    amole_device_id = fields.Char('Device ID')
    amole_trace_no = fields.Char('Trace No')
    amole_payment = fields.Many2one('amole.payment', string='Amole payment')
    amole_url = fields.Char('URL')
    ussd_url = fields.Char('USSD URL')

    @api.onchange('use_payment_terminal')
    def onchange_amole_payment_terminal(self):
        if self.use_payment_terminal == 'amole':
            amole_pay = self.env['amole.payment'].search([], limit=1)
            if amole_pay:
                self.amole_payment = amole_pay.id
            else:
                amole_created = self.env['amole.payment'].create({
                    'name': 'Amole'
                })
                self.amole_payment = amole_created.id

    def send_request_amole(self, data):
        self.sudo().amole_payment.trace_no = ' '
        headers = {'Content-Type': 'application/json'}
        data['deviceId'] = self.amole_device_id
        response = requests.post(self.amole_url, json=data, headers=headers)
        self.sudo().amole_payment.trace_no = data['trace_no']
        lod_json = json.loads(response.text)
        if lod_json['result']['msg'] == 'failed!':
            return {
                'response': response,
                'msg': 'Failure',
                'trace_no': data['trace_no'],
                'longMsg': lod_json['result']['longMsg'],
            }
        else:
            return {
                    'response': response,
                    'msg': 'Success',
                    'trace_no': data['trace_no'],
                    'longMsg': lod_json['result']['longMsg'],
            }

    def send_ussd_amole(self, data):
        headers = {'Content-Type': 'application/json'}
        response = requests.post(self.ussd_url, json=data, headers=headers)
        lod_json = json.loads(response.text)

        if lod_json['result']['msg'] == 'failed!':
            return {
                'msg': 'Failed',
                'longMsg': lod_json['result']['longMsg'],
            }
        else:
            return {
                'msg': 'Success',
                'longMsg': lod_json['result']['longMsg'],
            }

    def send_request_amole_event(self, data):
        headers = {'Content-Type': 'application/json'}
        response = requests.post(self.ussd_url, json=data['url'], headers=headers)
        lod_json = json.loads(response.text)
        pay_config = self.env['pos.config'].sudo().search([('id', '=', data['pos_session'])])
        pay_online_search = self.env['pos.online.payment'].sudo().search([('name', '=', data['traceNo'])])
        if not pay_online_search:
            pay_online = self.env['pos.online.payment'].sudo().create({
                'name': data['traceNo'],
                'pay_method': 'Amole',
                'price': data['amount'],
                'payer_id': self.telebirr_app_id,
                'pos_config': pay_config.id
            })

        if lod_json['result']['msg'] == 'failed!':
            return {
                'msg': 'Failed',
                'longMsg': lod_json['result']['longMsg'],
            }
        else:
            return {
                'msg': 'Success',
                'longMsg': lod_json['result']['longMsg'],
            }

    def find_trace_number_amole(self, id):
        amole_pay = self.env['amole.payment'].search([('id', '=', id)])
        return {
            "data": amole_pay.trace_no
        }
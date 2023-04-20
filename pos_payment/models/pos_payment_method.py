from odoo import fields, models, api, _

import logging

import json, requests

_logger = logging.getLogger(__name__)


class PosPaymentMethod(models.Model):
    _inherit = 'pos.payment.method'

    check_url = fields.Char('Payment Confirm URL')

    def send_request_trace_no(self, data):
        headers = {'Content-Type': 'application/json'}
        pay_meth = self.env['pos.payment.method'].search([('id', '=', data['payment_method'])])
        if pay_meth:
            response = requests.post('http://196.189.44.60:8069/telebirr/ussd/local_query', json=data, headers=headers)
            lod_json = json.loads(response.text)
            amount = round(data['amount'], 2)
            print(lod_json, 'JSON', amount)
            if lod_json['result'] == 'could not find':
                return {
                    'msg': 'failed',
                    'longMsg': 'Trace Number Not Found'
                }
            else:
                if lod_json['result']['msg'] == 'pending' and lod_json['result']['amount'] == amount:
                    return {
                        'msg': 'pending',
                        'longMsg': 'Transaction is not Completed',
                    }
                elif lod_json['result']['msg'] == 'confiremed' and lod_json['result']['amount'] == amount:
                    return {
                        'msg': 'Success',
                        'longMsg': 'Transaction is Completed',
                    }
                elif lod_json['result']['msg'] == 'failed' and lod_json['result']['amount'] == amount:
                    return {
                        'msg': 'failed',
                        'longMsg': 'Transaction has Failed',
                    }
                elif lod_json['result']['amount'] != amount:
                    return {
                        'msg': 'failed',
                        'longMsg': 'The price is incorrect',
                    }

        else:
            return {
                'longMsg': 'No Payment Method Found'
        }
from odoo import fields, models, api, _

import logging

import json, requests

_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'pos.config'

    amole_event = fields.Boolean('Amole Event')
    amole_url = fields.Char('Amole Url')
    ussd_url = fields.Char('USSD URL')
    api_key = fields.Char('API KEY')
    app_id = fields.Char('APP ID')

    content_types = fields.Char('Content Types URL')
    content_category = fields.Char('Content Category URL')
    content_items = fields.Char('Content Items URL')
    content_item = fields.Char('Content Item URL')

    def send_request_amole(self, data):
        headers = {'Content-Type': 'application/json'}
        data['apiKey'] = self.api_key
        data['payerId'] = self.app_id
        try:
            response = requests.post(self.amole_url, json=data, headers=headers)
        except:
            return {
                'msg': 'Failed',
                'longMsg': 'Connection To Amole Failed',
            }
        lod_json = json.loads(response.text)
        print(lod_json, 'LOS')
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
        data['apiKey'] = self.api_key
        data['payerId'] = self.app_id
        try:
            response = requests.post(self.ussd_url, json=data, headers=headers)
        except:
            return {
                'msg': 'Failed',
                'longMsg': 'Connect To Amole Service Failed',
            }
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

    def send_request_amole_item(self, data):
        headers = {'Content-Type': 'application/json'}
        data['apiKey'] = self.api_key
        data['payerId'] = self.app_id
        try:
            response = requests.post(self.content_item, json=data, headers=headers)
        except:
            return {
                'msg': 'Failed',
                'longMsg': "Couldn't Connnect With Amole"
            }
        lod_json = json.loads(response.text)
        con_json = json.loads(lod_json['result']['data'])
        if lod_json['result']['msg'] == 'failed!':
            return {
                'msg': 'Failed',
                'longMsg': lod_json['result']['longMsg'],
            }
        else:
            return {
                'msg': 'Success',
                'longMsg': lod_json['result']['longMsg'],
                'data': con_json,
            }

    def send_request_amole_items(self, data):
        headers = {'Content-Type': 'application/json'}
        data['apiKey'] = self.api_key
        data['payerId'] = self.app_id
        try:
            response = requests.post(self.content_items, json=data, headers=headers)
        except:
            return {
                'msg': 'Failed',
                'longMsg': "Couldn't Connnect With Amole"
            }
        lod_json = json.loads(response.text)
        con_json = json.loads(lod_json['result']['data'])
        if lod_json['result']['msg'] == 'failed!':
            return {
                'msg': 'Failed',
                'longMsg': lod_json['result']['longMsg'],
            }
        else:
            return {
                'msg': 'Success',
                'longMsg': lod_json['result']['longMsg'],
                'data': con_json['ContentItems']
            }

    def send_request_amole_category(self, data):
        headers = {'Content-Type': 'application/json'}
        data['apiKey'] = self.api_key
        data['payerId'] = self.app_id
        try:
            response = requests.post(self.content_category, json=data, headers=headers)
        except:
            return {
                'msg': 'Failed',
                'longMsg': "Couldn't Connnect With Amole"
            }
        lod_json = json.loads(response.text)
        con_json = json.loads(lod_json['result']['data'])
        if lod_json['result']['msg'] == 'failed!':
            return {
                'msg': 'Failed',
                'longMsg': lod_json['result']['longMsg'],
            }
        else:
            return {
                'msg': 'Success',
                'longMsg': lod_json['result']['longMsg'],
                'data': con_json['Categories']
            }

    def send_request_amole_event(self, data):
        headers = {'Content-Type': 'application/json'}
        data['apiKey'] = self.api_key
        data['payerId'] = self.app_id
        print(data)
        try:
            response = requests.post(self.content_types, json=data, headers=headers)
        except:
            return {
                'msg': 'Failed',
                'longMsg': "Couldn't Connnect With Amole"
            }
        lod_json = json.loads(response.text)
        print(lod_json, 'LOD')
        con_json = json.loads(lod_json['result']['data'])
        if lod_json['result']['msg'] == 'failed!':
            return {
                'msg': 'Failed',
                'longMsg': lod_json['result']['longMsg'],
            }
        else:
            return {
                'msg': 'Success',
                'longMsg': lod_json['result']['longMsg'],
                'data': con_json['ContentTypes']
            }
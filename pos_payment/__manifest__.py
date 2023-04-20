# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'POS Payment',
    'version': '1.0',
    'category': 'Sales/Point of Sale',
    'sequence': 6,
    'summary': 'Integrate your POS with a payment terminal',
    'description': '',
    'data': [
        'security/ir.model.access.csv',
        'views/pos_assets.xml',
        'views/pos_payment_method.xml',
        'views/pos_online_payment.xml',
        'views/pos_order.xml',
    ],
    'depends': ['point_of_sale'],
    'qweb': [
        'static/src/xml/PaymentScreenPaymentLines.xml',
    ],
    'installable': True,
    'license': 'LGPL-3',
}

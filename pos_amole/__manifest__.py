# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'POS Amole',
    'version': '1.0',
    'category': 'Sales/Point of Sale',
    'sequence': 6,
    'summary': 'Integrate your POS with Amole payment terminal',
    'description': '',
    'data': [
        'security/ir.model.access.csv',
        'views/pos_payment_method.xml',
        'views/pos_config.xml',
        'views/pos_assets.xml',
    ],
    'depends': ['point_of_sale', 'pos_payment'],
    'qweb': [
        'static/src/xml/PaymentScreenPaymentLines.xml',
        'static/src/xml/AmolePadWidget.xml',
        'static/src/xml/ProductScreen.xml',
        'static/src/xml/AmoleEventListScreen.xml',
        'static/src/xml/AmoleEventLine.xml',
        'static/src/xml/AmoleCategoryLine.xml',
        'static/src/xml/AmoleItemContent.xml',
        'static/src/xml/AmoleSingleItem.xml',
    ],
    'installable': True,
    'license': 'LGPL-3',
}

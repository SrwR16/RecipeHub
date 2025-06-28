from rest_framework import viewsets
from . import models
from .serializers import PromotionsSerializers
from decimal import Decimal
from django.urls import reverse
from django.http import JsonResponse, HttpResponseBadRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import requests
import json

# Create your views here.

class PromotionViewset(viewsets.ModelViewSet):
    queryset = models.Promotions.objects.all()
    serializer_class = PromotionsSerializers

@csrf_exempt
def checkout(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data.get('id')
            amount = data.get('price')
            print(product_id, amount)
            if not product_id or not amount:
                return JsonResponse({'error': 'Invalid product ID or amount'}, status=400)
            url = "https://sandbox.sslcommerz.com/gwprocess/v4/api.php"
            store_id = 'abc6614dbee40ed8'
            store_passwd = 'abc6614dbee40ed8@ssl'

            post_data = {
                'store_id': store_id,
                'store_passwd': store_passwd,
                'total_amount': amount,
                'currency': 'BDT',
                'tran_id': f"TRANS_{product_id}",
                'success_url': request.build_absolute_uri(reverse('payment_success')),
                'fail_url': request.build_absolute_uri(reverse('payment_fail')),
                'cancel_url': request.build_absolute_uri(reverse('payment_cancel')),
                'emi_option': 0,
                'cus_name': 'Customer Name',
                'cus_email': 'customer@example.com',
                'cus_add1': 'Dhaka',
                'cus_add2': 'Dhaka',
                'cus_city': 'Dhaka',
                'cus_postcode': '1207',
                'cus_country': 'Bangladesh',
                'cus_phone': '01741501656',
                'shipping_method': 'NO',
                'product_name': 'Product Name',
                'product_category': 'general',
                'product_profile': 'general'
            }

            response = requests.post(url, data=post_data)
            response_data = response.json()
            print(response_data)
            if(response_data.get('status') == 'SUCCESS'):
                return JsonResponse({'GatewayPageURL': response_data['GatewayPageURL']})
            else:
                return JsonResponse({'error': 'Failed to initiate payment'})
        except Exception as e:
            return JsonResponse({'error':str(e)}, status=500)
        
    return HttpResponseBadRequest("Only POST requests are allowed")

@csrf_exempt
def payment_success(request):
    # Handle payment success logic here
    return HttpResponse("Payment Success")

@csrf_exempt
def payment_fail(request):
    # Handle payment failure logic here
    return HttpResponse("Payment Failed")

@csrf_exempt
def payment_cancel(request):
    # Handle payment cancellation logic here
    return HttpResponse("Payment Cancelled")

from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import PromotionViewset, checkout, payment_success, payment_fail, payment_cancel

router = DefaultRouter()
router.register('list', PromotionViewset)

urlpatterns = [
    path('', include(router.urls)),
    path('product/payment/', checkout),
    path('payment-success/', payment_success, name='payment_success'),
    path('payment-fail/', payment_fail, name='payment_fail'),
    path('payment-cancel/', payment_cancel, name='payment_cancel'),
]

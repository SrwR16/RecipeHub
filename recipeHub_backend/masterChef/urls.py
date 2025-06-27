from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('chef', views.HumanTextViewset)
router.register('response', views.SavingResponseViewset)
urlpatterns = [
    path('', include(router.urls))
]

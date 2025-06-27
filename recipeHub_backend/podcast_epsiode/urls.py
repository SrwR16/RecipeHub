from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()
router.register('list/normal', views.PodcastEpisodeNormalViewset)
router.register('list/premium', views.PodcastEpisodePremiumViewset)

urlpatterns = [
    path('', include(router.urls)),
]
from rest_framework.routers import DefaultRouter
from django.urls import path, include
from . import views

router = DefaultRouter()
router.register('list', views.CommentViewset)
router.register('react/list', views.ReactViewset)

urlpatterns = [
    path('', include(router.urls))
]


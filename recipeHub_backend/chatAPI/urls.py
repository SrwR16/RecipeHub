from django.urls import path, include
from .views import SearchUser
from rest_framework.routers import DefaultRouter
from .views import ChatGroupViewset, GroupMessageViewSet ,ProfileViewset


router = DefaultRouter()
router.register('group', ChatGroupViewset)
router.register('message', GroupMessageViewSet)
router.register('profile', ProfileViewset)

urlpatterns = [
    path('search/<username>/', SearchUser.as_view()),
    path('', include(router.urls)),
]
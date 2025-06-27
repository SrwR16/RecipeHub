from django.urls import path
from .consumers import NotificationConsumer

comments_urlpatterns = [
    path('ws/notifications/' , NotificationConsumer.as_asgi()),
]

# ws://127.0.0.1:8000/ws/notifications/1/
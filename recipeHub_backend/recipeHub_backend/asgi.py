import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recipeHub_backend.settings')
from django.core.asgi import get_asgi_application

from channels.routing import ProtocolTypeRouter, URLRouter
from chatAPI.routing import chatAPI_urlpatterns
from comments.routing import comments_urlpatterns
from channels.auth import AuthMiddlewareStack

websocket_urlpatterns = chatAPI_urlpatterns + comments_urlpatterns

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            websocket_urlpatterns,
        )
    ),
})

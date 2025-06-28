from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),

    path('auth/', include('authentication.api.urls')),
    path('user/', include('user.urls')),

    path('banner/', include('banner.urls')),
    path('kitchen/', include('kitchen.urls')),
    path('comment/', include('comments.urls')),
    path('support/', include('support.urls')),
    path('promotions/', include('promotions.urls')),
    path('podcast/episode/', include('podcast_epsiode.urls')),
    path('podcast/', include('podcast.urls')),
    path('chat/', include('chatAPI.urls')),
    path('popular/', include('popularuty.urls')),
    path('order/', include('order.urls')),
    path('rating/', include('ratings.urls')),
    path('subscription/', include('subscription.urls')),
    path('ai/', include('masterChef.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [path('__debug__/', include(debug_toolbar.urls))]
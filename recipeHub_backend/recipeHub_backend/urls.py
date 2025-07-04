from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("authentication.api.urls")),
    path("api/user/", include("user.urls")),
    path("api/banner/", include("banner.urls")),
    path("api/kitchen/", include("kitchen.urls")),
    path("api/comment/", include("comments.urls")),
    path("api/support/", include("support.urls")),
    path("api/promotions/", include("promotions.urls")),
    path("api/podcast/episode/", include("podcast_epsiode.urls")),
    path("api/podcast/", include("podcast.urls")),
    path("api/chat/", include("chatAPI.urls")),
    path("api/popular/", include("popularuty.urls")),
    path("api/order/", include("order.urls")),
    path("api/rating/", include("ratings.urls")),
    path("api/subscription/", include("subscription.urls")),
    path("api/ai/", include("masterChef.urls")),
    path("api/food-map/", include("food_map.urls")),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    import debug_toolbar

    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]

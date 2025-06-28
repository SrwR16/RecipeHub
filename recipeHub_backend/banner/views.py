from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets

from .models import Banner
from .serializers import BannnerSerializers


@method_decorator(csrf_exempt, name="dispatch")
class BannerViewset(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannnerSerializers

    def get_queryset(self):
        queryset = super().get_queryset()
        id = self.request.query_params.get("id")
        if id and id != "null":
            queryset = queryset.filter(id=id)
        return queryset

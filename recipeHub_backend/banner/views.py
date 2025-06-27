from rest_framework import viewsets
from .models import Banner
from .serializers import BannnerSerializers

class BannerViewset(viewsets.ModelViewSet):
    queryset = Banner.objects.all()
    serializer_class = BannnerSerializers

    def get_queryset(self):
        queryset = super().get_queryset()
        id = self.request.query_params.get('id')
        if id:
            queryset = queryset.filter(id=id)
        return queryset

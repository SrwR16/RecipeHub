from django.conf import settings
from django.core.mail import send_mail
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets

from . import models, serializers

# Create your views here.


@method_decorator(csrf_exempt, name="dispatch")
class ContactViewSet(viewsets.ModelViewSet):
    queryset = models.Contact.objects.all()
    serializer_class = serializers.ContactSerializer

    def perform_create(self, serializer):
        contact = serializer.save()

        subject = "Need a support"
        message = (
            f"Name: {contact.name}\nPhone: {contact.phone}\nMessage: {contact.message}"
        )
        form_email = contact.user.email
        recipient_list = [settings.EMAIL_HOST_USER]
        send_mail(subject, message, form_email, recipient_list)

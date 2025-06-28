from django.db import models
from user.models import CustomUser

class Subscription (models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    subcription_type = models.CharField(max_length=50)

    def __str__(self):
        return f'You {self.user} subscribed {self.subcription_type}'


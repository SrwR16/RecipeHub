from django.db import models
from user.models import CustomUser

# Create your models here.
class HumanText(models.Model):
    text = models.TextField()
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    def __str__(self):
        return self.text
    
class SavingResponse(models.Model):
    instance_human = models.JSONField(blank=True, null=True)
    ai_response = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.ai_response
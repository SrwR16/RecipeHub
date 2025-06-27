from django.db import models
from subscription.models import Subscription

class Podcast(models.Model):
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='uploads/podcast/')
    keyword = models.CharField(max_length=20)
    description = models.TextField()

    def __str__(self):
        return self.name
    
class PremimumPodcast(models.Model):
    name = models.CharField(max_length=100)
    image = models.ImageField(upload_to='uploads/podcast/')
    keyword = models.CharField(max_length=20)
    description = models.TextField()
    
    def __str__(self):
        return self.name



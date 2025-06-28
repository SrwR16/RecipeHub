from django.db import models
from promotions.models import Promotions
from user.models import CustomUser

class Rating(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    rating = models.CharField(max_length=200)
    promotions = models.ForeignKey(Promotions, on_delete=models.CASCADE)
    
    def __str__(self):
        return f'User {self.user} rate {self.rating} on the product {self.promotions}'
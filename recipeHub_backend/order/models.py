from django.db import models
from user.models import CustomUser

class Order(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, blank=True, null=True)
    payment_date = models.DateTimeField(auto_now_add=True)
    is_payment = models.BooleanField(default=False)
    payment_amount = models.IntegerField()
    pay_reason = models.CharField(max_length=100)
    
    def __str__(self):
        return f'User {self.user} pay: {self.payment_amount} at {self.payment_date}'
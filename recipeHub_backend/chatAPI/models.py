from django.db import models
from user.models import CustomUser
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, blank=True, null=True)  # Changed to OneToOneField
    full_name = models.CharField(max_length=100, null=True, blank=True)
    image = models.ImageField(upload_to="uploads/profile", default="default.jpg", null=True, blank=True)
    user_creation_date = models.DateField(auto_now_add=True, blank=True, null=True)
    verified = models.BooleanField(default=False)

    def __str__(self):
        return self.full_name or self.user.email


@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()



class ChatGroup(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    group_name = models.CharField(max_length=128, unique=True)

    def __str__(self):
        return self.group_name
    
class GroupMessage(models.Model):
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE)
    author = models.ForeignKey(CustomUser,  on_delete=models.CASCADE, blank=True, null=True)
    body = models.CharField(max_length=300)
    created = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f'{self.author} : {self.body}'
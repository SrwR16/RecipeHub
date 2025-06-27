from django.db.models.signals import post_save
from django.dispatch import receiver
from user.models import CustomUser  # Import CustomUser from its app
from .models import Profile  # Import Profile from the current app

@receiver(post_save, sender=CustomUser)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=CustomUser)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

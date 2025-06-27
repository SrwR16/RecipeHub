from django.db.models.signals import post_save
from django.dispatch import receiver
from comments.models import Comment  # Import CustomUser from its app


@receiver(post_save, sender=Comment)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Comment.objects.create(commet=instance)

@receiver(post_save, sender=Comment)
def save_user_profile(sender, instance, **kwargs):
    instance.comment.save()

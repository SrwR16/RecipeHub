import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Reaction
from kitchen.models import Recipe
from user.models import CustomUser
from channels.db import database_sync_to_async
from asgiref.sync import sync_to_async

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        group_name = "notifications"
        print("websocket connected....", group_name)
        group_name = f'user_notifications_{group_name}'
        print("Group Name...", group_name)

        # Join the user notification group
        await self.channel_layer.group_add(
            group_name, 
            self.channel_name
            )
        
        await self.accept()

    async def disconnect(self, close_code):
        print("Websocket disconnected...", close_code)
        group_name = "notifications"
        print("websocket disconnected....", group_name)
        group_name = f'user_notifications_{group_name}'
        print("Dis Group Name...", group_name)
        await self.channel_layer.group_discard(
            group_name, 
            self.channel_name
            )

    async def receive(self, text_data):
        group_name = "notifications"
        group_name = f'user_notifications_{group_name}'
        data = json.loads(text_data)
        print("Messaged recived from user ...", data)

        recipe_id = data['recipe_id']
        from_userId = data['from_userId']
        to_userId = data['to_userId']
        print("Recipe ID recived from user...",recipe_id)
        print("Who reacted: user...",from_userId)
        print("Where reacted: user...",to_userId)

        # Save the reaction to the database
        reaction, recipe = await self.create_reaction(from_userId, recipe_id)

        user = await sync_to_async(CustomUser.objects.get)(pk=from_userId)
        await sync_to_async(print)("Username:....", user)

        await sync_to_async(print)("Reaction...:", reaction)
        await sync_to_async(print)("Recipe...:", recipe)
        # Notify the user about the new reaction
        await self.channel_layer.group_send(
            group_name,
            {
                'type': 'send_notification',
                'message': f'{user.first_name} {user.last_name} Reacted To Your {recipe.title} Post',
                'recipe_id': recipe_id,
                'from_userId': from_userId,
                'to_userId': to_userId
            }
        )
    @database_sync_to_async
    def create_reaction(self, user_id, recipe_id):
        reaction = Reaction.objects.create(user_id=user_id, recipe_id=recipe_id, react=True)
        recipe = Recipe.objects.get(pk=recipe_id)
        return reaction, recipe

    async def send_notification(self, event):
        message = event['message']
        recipe_id = event['recipe_id']
        from_userId = event['from_userId']
        to_userId = event['to_userId']

    # Send the notification to the WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'recipe_id': recipe_id,
            'from_userId': from_userId,
            'to_userId': to_userId
        }))
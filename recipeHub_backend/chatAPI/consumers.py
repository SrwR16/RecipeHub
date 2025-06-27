from channels.consumer import SyncConsumer, AsyncConsumer
from channels.exceptions import StopConsumer
from time import sleep
from asgiref.sync import sync_to_async
import json
connection_counts = {}

class MyAsyncConsumer(AsyncConsumer):
    async def websocket_connect(self, event):
        print("Websocket Connected...")
        group_name = self.scope['url_route']['kwargs']['group_name']
        
        # Increment the connection count for this group
        connection_counts[group_name] = connection_counts.get(group_name, 0) + 1

        # Add the channel to the group
        await self.channel_layer.group_add(
            group_name, 
            self.channel_name
            )

        await self.send({
            'type': 'websocket.accept'
        })

        # Now that the socket is accepted, send the updated count
        await self.send({
            'type': 'websocket.send',
            'text': json.dumps({
                'type': 'connection_count',
                'count': connection_counts[group_name]
            })
        })

    async def websocket_receive(self, event):
        group_name = self.scope['url_route']['kwargs']['group_name']
        await self.channel_layer.group_send(
            group_name,
            {
                'type': 'chat.message',
                'message': event['text']
            }
        )

    async def chat_message(self, event):
        print('Event...', event)
        # send the message back to the websocket
        await self.send({
            'type': 'websocket.send',
            'text': event['message']
        })
    
    async def websocket_disconnect(self, event):
        group_name = self.scope['url_route']['kwargs']['group_name']
        
        # Decrement the connection count for this group
        if group_name in connection_counts:
            connection_counts[group_name] -= 1
            if connection_counts[group_name] <= 0:
                del connection_counts[group_name]  # Remove the group if count is 0

        await self.channel_layer.group_discard(
            group_name, 
            self.channel_name
            )

        # Send the updated count to the frontend
        await self.send({
            'type': 'websocket.send',
            'text': json.dumps({
                'type': 'connection_count',
                'count': connection_counts.get(group_name, 0)
            })
        })
        raise StopConsumer()

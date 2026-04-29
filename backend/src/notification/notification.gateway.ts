/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('Token is required');

      const decoded = this.jwtService.verify(token);

      const userId = decoded.id;

      await client.join(userId);

      console.log(
        `[Socket] HR ${userId} is connected (Socket ID: ${client.id})`,
      );
    } catch (error: any) {
      console.log(
        `[Socket] Connect decline: ${client.id} - Error: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[Socket] Client disconnect: ${client.id}`);
  }

  @OnEvent('notification.send')
  handleSendNotification(payload: any) {
    console.log(`[Socket] Sending notification to User: ${payload.userId}`);

    this.server.to(payload.userId).emit('onNewNotification', payload);
  }
}

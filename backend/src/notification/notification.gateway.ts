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
import { Injectable, Logger } from '@nestjs/common';
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
  implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) { }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    try {
      const token = client.handshake.auth.token;
      if (!token) throw new Error('Token is required');

      const decoded = this.jwtService.verify(token);

      const userId = String(decoded.sub || decoded.id);
      await client.join(userId);

      this.logger.log(
        `HR ${userId} is connected (Socket ID: ${client.id})`,
      );
    } catch (error: any) {
      this.logger.warn(
        `Connect decline: ${client.id} - Error: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnect: ${client.id}`);
  }

  @OnEvent('notification.send')
  handleSendNotification(payload: any) {
    this.logger.log(`Sending notification to User: ${payload.userId}`);
    const targetRoom = String(payload.userId);
    this.server.to(targetRoom).emit('onNewNotification', payload);
  }
}

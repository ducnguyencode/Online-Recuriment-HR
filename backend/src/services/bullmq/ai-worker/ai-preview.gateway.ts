import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class AiPreviewGateway {
  @WebSocketServer()
  server: Server;

  emitCompleted(data: any, applicationId: number) {
    this.server.emit(`ai-preview`, { data, applicationId });
  }
}

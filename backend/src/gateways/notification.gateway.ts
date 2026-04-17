import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
@WebSocketGateway({
    cors: {
        origin: '*', // Tạm thời cho phép mọi Frontend kết nối để dễ test
    },
    namespace: '/notifications', // Giao kèo đường dẫn: ws://localhost:3000/notifications
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // Khi có một Client (Frontend) kết nối vào
    handleConnection(client: Socket) {
        console.log(`[Socket] Client kết nối: ${client.id}`);

        // (Sau này bạn sẽ check JWT Token ở đây và cho vào Room)
        // Tạm thời mình cứ log ra để test đã
    }

    // Khi Client ngắt kết nối
    handleDisconnect(client: Socket) {
        console.log(`[Socket] Client ngắt kết nối: ${client.id}`);
    }

    // Lắng nghe sự kiện nội bộ từ Dev 2 (hoặc từ Mock Trigger của bạn)
    @OnEvent('notification.send')
    handleSendNotification(payload: any) {
        console.log('[Socket] Nhận được event báo gửi thông báo, đang đẩy xuống Frontend...');

        // Bắn sự kiện 'onNewNotification' xuống cho tất cả Client đang kết nối
        this.server.emit('onNewNotification', payload);
    }
}
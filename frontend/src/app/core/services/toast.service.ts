import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    toasts = signal<Toast[]>([]);
    private counter = 0;

    show(message: string, type: ToastType = 'info') {
        const id = this.counter++;
        // Thêm thông báo mới vào danh sách
        this.toasts.update(currentToasts => [...currentToasts, { id, message, type }]);

        // Tự động tắt sau 3.5 giây
        setTimeout(() => this.remove(id), 3500);
    }

    success(msg: string) { this.show(msg, 'success'); }
    error(msg: string) { this.show(msg, 'error'); }
    warning(msg: string) { this.show(msg, 'warning'); }
    info(msg: string) { this.show(msg, 'info'); }

    remove(id: number) {
        this.toasts.update(currentToasts => currentToasts.filter(t => t.id !== id));
    }
}
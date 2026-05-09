import { Injectable, signal } from '@angular/core';

export type ConfirmType = 'success' | 'error' | 'warning' | 'info';

export interface ConfirmDialog {
  title: string;
  message: string;
  cancel: boolean;
  confirm: boolean;
  confirmAction?: () => void;
  type: ConfirmType;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  confirmDiablog = signal<ConfirmDialog>({
    title: 'Confirm',
    message: '',
    type: 'info',
    cancel: true,
    confirm: true,
  });

  show(
    message: string,
    title: string,
    type: ConfirmType = 'info',
    cancel: boolean = true,
    confirm: boolean = true,
    confirmAction?: () => void,
  ) {
    this.confirmDiablog.set({
      title,
      message,
      type,
      cancel,
      confirm,
      confirmAction,
    });
  }
}

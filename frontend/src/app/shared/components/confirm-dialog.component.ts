import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from '../../core/services/confirm-message.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (dialog().message) {
      <div class="modal-backdrop" (click)="close()">
        <div
          class="modal-content"
          style="max-width: 400px;"
          (click)="$event.stopPropagation()"
        >
          <div class="modal-header">
            <h3 class="modal-title">
              {{ dialog().title }}
            </h3>

            <button class="btn-ghost btn-icon" (click)="close()">X</button>
          </div>

          <div class="modal-body">
            <p>{{ dialog().message }}</p>
          </div>

          <div class="modal-footer">
            @if (dialog().cancel) {
              <button class="btn-secondary" (click)="close()">Cancel</button>
            }

            @if (dialog().confirm) {
              <button class="btn-primary" (click)="confirm()">Confirm</button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  confirmService = inject(ConfirmService);

  dialog = this.confirmService.confirmDiablog;

  close() {
    this.confirmService.confirmDiablog.set({
      title: '',
      message: '',
      type: 'info',
      cancel: false,
      confirm: false,
    });
  }

  confirm() {
    this.dialog().confirmAction?.();
    this.close();
  }
}

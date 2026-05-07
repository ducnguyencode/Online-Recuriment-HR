import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border bg-white animate-in slide-in-from-right-8 fade-in duration-300"
             [class.border-green-200]="toast.type === 'success'" [class.border-red-200]="toast.type === 'error'">
          @if (toast.type === 'success') {
            <div class="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center text-green-500 shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
          } @else {
            <div class="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
          }
          <p class="text-sm font-bold text-slate-800">{{ toast.message }}</p>
          <button (click)="toastService.remove(toast.id)" class="ml-2 text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}

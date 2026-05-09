import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ToastComponent } from './shared/components/toast.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent, ConfirmDialogComponent],
  template: `<router-outlet /> <app-toast></app-toast><app-confirm-dialog />`,
})
export class AppComponent implements OnInit {
  constructor(public authService: AuthService) {}
  ngOnInit(): void {
    this.authService.refreshMe()?.subscribe({
      error: () => {
        this.authService.logout();
      },
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ToastComponent } from './shared/components/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastComponent],
  template: `<router-outlet /> <app-toast></app-toast>`,
})
export class AppComponent implements OnInit {
  constructor(public authService: AuthService) { }
  ngOnInit(): void {
    this.authService.refreshMe()?.subscribe({
      error: () => {
        this.authService.logout();
      },
    });
  }
}

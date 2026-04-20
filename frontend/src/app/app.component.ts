import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
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

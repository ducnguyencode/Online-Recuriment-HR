import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  loginForm = { email: 'admin@test.com', password: '123456' };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {}

  login() {
    this.authService
      .login(this.loginForm.email, this.loginForm.password)
      .subscribe({
        next: (res) => {
          this.authService.handleLoginSuccess(res);
        },
        error: (err) => {},
      });
  }
}

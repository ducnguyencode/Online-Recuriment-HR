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
  loginForm = { email: '', password: '' };

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {}

  login() {
    this.authService
      .login(this.loginForm.email, this.loginForm.password)
      .subscribe({
        next: (res) => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {},
      });
  }
}

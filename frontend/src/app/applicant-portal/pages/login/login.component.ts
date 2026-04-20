import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { UserRole, UserRoleLogin } from '../../../core/models';

enum AuthView {
  LOGIN = 'Login',
  REGISTER = 'Register',
  FORGOT = 'Forgot',
  VERIFY_EMAIL = 'Verify email',
}
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  AuthView = AuthView;
  UserRoleLogin = UserRoleLogin;
  currentView: AuthView = AuthView.LOGIN;
  selectedRole: UserRoleLogin = UserRoleLogin.APPLICANT;
  verify_email: string = '';
  form = {
    email: 'applicant@test.com',
    password: '123456',
    fullName: '',
    phone: '',
  };
  formError = '';

  constructor() {}
  ngOnInit(): void {}

  switchView(view: AuthView) {
    this.currentView = view;
    this.verify_email = '';
    this.formError = '';
    this.form = {
      email: 'applicant@test.com',
      password: '123456',
      fullName: '',
      phone: '',
    };
  }

  setRole(role: UserRoleLogin) {
    this.selectedRole = role;
  }

  submit() {
    switch (this.currentView) {
      case AuthView.LOGIN:
        this.auth.login(this.form).subscribe({
          next: (res) => {
            if (this.selectedRole == UserRoleLogin.HR) {
              if (res.data.user.role == UserRole.APPLICANT) {
                this.formError = 'Email or password not correct!';
                return;
              }
            }
            this.auth.handleLoginSuccess(res, this.selectedRole);
          },
          error: (err) => {
            this.formError = err.error.message;
          },
        });
        break;
      case AuthView.REGISTER:
        this.auth.register(this.form).subscribe({
          next: (res) => {
            this.verify_email = res.data.email;
            this.currentView = AuthView.VERIFY_EMAIL;
          },
          error: (err) => {
            this.formError = err.error.message;
          },
        });
        break;
      default:
        this.switchView(AuthView.LOGIN);
        break;
    }
  }
}

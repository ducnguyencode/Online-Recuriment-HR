import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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
  private route = inject(ActivatedRoute);
  AuthView = AuthView;
  UserRoleLogin = UserRoleLogin;
  currentView: AuthView = AuthView.LOGIN;
  selectedRole: UserRoleLogin = UserRoleLogin.APPLICANT;
  verify_email: string = '';
  forgot_email: string = '';
  resetToken: string = '';
  form = {
    email: 'applicant@test.com',
    password: '123456',
    fullName: '',
    phone: '',
  };
  formError = '';

  constructor() {}
  ngOnInit(): void {
    const resetToken = this.route.snapshot.queryParamMap.get('resetToken');
    if (resetToken) {
      this.resetToken = resetToken;
      this.currentView = AuthView.FORGOT;
      this.formError = '';
      this.form.password = '';
    }
  }

  switchView(view: AuthView) {
    this.currentView = view;
    this.verify_email = '';
    this.forgot_email = '';
    this.resetToken = '';
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
      case AuthView.FORGOT:
        if (this.resetToken) {
          this.auth.resetPassword(this.resetToken, this.form.password).subscribe({
            next: () => {
              this.resetToken = '';
              this.form.password = '';
              this.currentView = AuthView.LOGIN;
              this.formError = '';
            },
            error: (err: any) => {
              this.formError = err.error?.message ?? 'Reset password failed.';
            },
          });
        } else {
          if (this.forgot_email) {
            this.switchView(AuthView.LOGIN);
            return;
          }
          this.auth.forgotPassword(this.form.email).subscribe({
            next: () => {
              this.formError = '';
              this.forgot_email = this.form.email.trim();
            },
            error: (err: any) => {
              this.formError =
                err.error?.message ?? 'Failed to send reset email.';
              this.forgot_email = '';
            },
          });
        }
        break;
      default:
        this.switchView(AuthView.LOGIN);
        break;
    }
  }
}

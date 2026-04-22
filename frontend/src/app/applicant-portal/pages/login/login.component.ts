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
  loginPortal: 'applicant' | 'staff' = 'applicant';
  verify_email: string = '';
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
    const portal = this.route.snapshot.data['portal'];
    if (portal === 'staff') {
      this.loginPortal = 'staff';
      this.selectedRole = UserRoleLogin.HR;
    } else {
      this.loginPortal = 'applicant';
      this.selectedRole = UserRoleLogin.APPLICANT;
    }
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
    this.resetToken = '';
    this.formError = '';
    this.form = {
      email: 'applicant@test.com',
      password: '123456',
      fullName: '',
      phone: '',
    };
    if (this.loginPortal === 'staff') {
      this.selectedRole = UserRoleLogin.HR;
    }
  }

  setRole(role: UserRoleLogin) {
    if (this.loginPortal === 'staff' && role === UserRoleLogin.APPLICANT) {
      return;
    }
    this.selectedRole = role;
  }

  submit() {
    switch (this.currentView) {
      case AuthView.LOGIN:
        this.auth
          .login({
            ...this.form,
            portal:
              this.loginPortal === 'staff'
                ? 'staff'
                : this.selectedRole === UserRoleLogin.HR
                  ? 'staff'
                  : 'applicant',
          })
          .subscribe({
          next: (res) => {
            if (
              this.loginPortal === 'staff' &&
              res.data.user.role == UserRole.APPLICANT
            ) {
              this.formError =
                'Applicant không thể đăng nhập bằng URL dành cho HR/Superadmin/Interviewer.';
              return;
            }
            if (this.selectedRole == UserRoleLogin.HR) {
              if (res.data.user.role == UserRole.APPLICANT) {
                this.formError = 'Email or password not correct!';
                return;
              }
            }
            const roleForRedirect =
              res.data.user.role === UserRole.APPLICANT
                ? UserRoleLogin.APPLICANT
                : UserRoleLogin.HR;
            this.auth.handleLoginSuccess(res, roleForRedirect);
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
            error: (err) => {
              this.formError = err.error?.message ?? 'Reset password failed.';
            },
          });
        } else {
          this.auth.forgotPassword(this.form.email).subscribe({
            next: () => {
              this.formError = '';
            },
            error: (err) => {
              this.formError =
                err.error?.message ?? 'Failed to send reset email.';
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

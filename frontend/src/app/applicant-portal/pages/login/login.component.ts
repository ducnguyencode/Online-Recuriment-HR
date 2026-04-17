import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  viewMode: string = 'login';
  readonly auth = inject(AuthService);
  isStaffPortal = false;

  loginForm = {
    email: '',
    password: '',
  };

  registerForm = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  resetForm = {
    newPassword: '',
    confirmPassword: '',
  };
  resetToken = '';

  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.isStaffPortal = this.route.snapshot.data['portal'] === 'staff';
    this.checkRoute();
    this.resetToken = this.route.snapshot.queryParamMap.get('token') ?? '';
  }

  checkRoute() {
    const currentUrl = this.router.url;
    if (this.isStaffPortal) {
      this.viewMode = 'login';
      return;
    }
    if (currentUrl.includes('register')) {
      this.viewMode = 'register';
    } else if (currentUrl.includes('reset-password')) {
      this.viewMode = 'reset';
    } else if (currentUrl.includes('forgot-password')) {
      this.viewMode = 'forgot';
    } else {
      this.viewMode = 'login';
    }
  }

  handleFormSubmit(event: Event) {
    event.preventDefault();
    this.errorMessage = '';
    this.successMessage = '';

    if (this.viewMode === 'login') {
      this.submitLogin();
      return;
    }

    if (this.viewMode === 'register') {
      this.submitApplicantRegister();
      return;
    }

    if (this.viewMode === 'forgot') {
      this.submitForgotPassword();
      return;
    }

    if (this.viewMode === 'reset') {
      this.submitResetPassword();
      return;
    }

    this.successMessage = 'Chức năng quên mật khẩu chưa được backend hỗ trợ.';
  }

  private submitLogin() {
    this.isSubmitting = true;
    this.auth.login(this.loginForm.email, this.loginForm.password).subscribe({
      next: (response) => {
        const role = this.auth.mapApiUserToUserAccount(response.user).role;
        if (this.isStaffPortal && role !== 'HR' && role !== 'Superadmin') {
          this.errorMessage = 'Trang này chỉ dành cho HR/Admin. Vui lòng dùng trang đăng nhập ứng viên.';
          this.isSubmitting = false;
          return;
        }
        if (!this.isStaffPortal && (role === 'HR' || role === 'Superadmin')) {
          this.errorMessage = 'Tài khoản HR/Admin vui lòng đăng nhập tại /staff-login.';
          this.isSubmitting = false;
          return;
        }
        this.auth.handleLoginSuccess(response);
        this.successMessage = response.user.mustChangePassword
          ? 'Đăng nhập thành công. Tài khoản này cần đổi mật khẩu sau lần đăng nhập đầu tiên.'
          : 'Đăng nhập thành công.';
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Đăng nhập thất bại.';
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  private submitApplicantRegister() {
    if (!this.registerForm.fullName || !this.registerForm.email || !this.registerForm.password) {
      this.errorMessage = 'Vui lòng nhập đầy đủ thông tin.';
      return;
    }
    if (this.registerForm.password.length < 6) {
      this.errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự.';
      return;
    }
    if (this.registerForm.password !== this.registerForm.confirmPassword) {
      this.errorMessage = 'Xác nhận mật khẩu không khớp.';
      return;
    }

    this.isSubmitting = true;
    this.auth
      .applicantRegister({
        fullName: this.registerForm.fullName,
        email: this.registerForm.email,
        password: this.registerForm.password,
      })
      .subscribe({
        next: (response) => {
          this.auth.handleLoginSuccess(response);
          this.successMessage = 'Đăng ký thành công. Đang chuyển vào trang ứng viên...';
        },
        error: (error) => {
          this.errorMessage = error?.error?.message || 'Đăng ký thất bại.';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        },
      });
  }

  private submitForgotPassword() {
    if (!this.loginForm.email) {
      this.errorMessage = 'Vui lòng nhập email để nhận link đặt lại mật khẩu.';
      return;
    }

    this.isSubmitting = true;
    this.auth.forgotPassword(this.loginForm.email).subscribe({
      next: (response) => {
        this.successMessage = response.message;
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Không thể gửi email quên mật khẩu.';
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  private submitResetPassword() {
    if (!this.resetToken) {
      this.errorMessage = 'Thiếu token đặt lại mật khẩu.';
      return;
    }

    if (!this.resetForm.newPassword || !this.resetForm.confirmPassword) {
      this.errorMessage = 'Vui lòng nhập đầy đủ mật khẩu mới.';
      return;
    }

    if (this.resetForm.newPassword.length < 6) {
      this.errorMessage = 'Mật khẩu mới phải có ít nhất 6 ký tự.';
      return;
    }

    if (this.resetForm.newPassword !== this.resetForm.confirmPassword) {
      this.errorMessage = 'Xác nhận mật khẩu không khớp.';
      return;
    }

    this.isSubmitting = true;
    this.auth.resetPassword(this.resetToken, this.resetForm.newPassword).subscribe({
      next: (response) => {
        this.successMessage = `${response.message}. Vui lòng đăng nhập lại.`;
        this.resetForm = { newPassword: '', confirmPassword: '' };
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Đặt lại mật khẩu thất bại.';
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }
}

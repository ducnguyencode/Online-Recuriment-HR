import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole, UserRoleLogin } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  // Expose enum to HTML template
  UserRoleLogin = UserRoleLogin;
  currentYear = new Date().getFullYear();

  selectedRole: UserRoleLogin = UserRoleLogin.APPLICANT;
  form = { email: '', password: '' };
  formError = '';
  successMessage = '';
  resendVerifyMessage = '';
  isLoading = false;
  isResendingVerify = false;
  showPassword = false;
  resendLoading = false;

  // --- BIẾN CHO LUỒNG 2FA ---
  currentStep: 'LOGIN' | 'SETUP_2FA' | 'VERIFY_2FA' = 'LOGIN';
  twoFactorCode = '';
  mockQrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=HR_Portal_Auth_Test';
  tempLoginRes: any; // Biến lưu tạm kết quả login bước 1 để xài cho bước 2

  ngOnInit(): void {
    const path = this.router.url;
    this.selectedRole = path.includes('hr/login')
      ? UserRoleLogin.HR
      : UserRoleLogin.APPLICANT;

    if (this.auth.isLoggedIn()) {
      const role = this.auth.currentUser()?.role;
      const canOpenHrPortal =
        role === UserRole.HR || role === UserRole.INTERVIEWER || role === UserRole.SUPER_ADMIN;
      const canOpenApplicantPortal = role === UserRole.APPLICANT;
      if (
        (this.selectedRole === UserRoleLogin.HR && canOpenHrPortal) ||
        (this.selectedRole === UserRoleLogin.APPLICANT && canOpenApplicantPortal)
      ) {
        this.router.navigate([this.selectedRole === UserRoleLogin.HR ? '/hr-portal' : '/']);
        return;
      }
    }

    if (this.route.snapshot.queryParamMap.get('registered') === '1') {
      this.successMessage =
        'Registration successful. Please check your email to verify your account.';
      this.toast.success(this.successMessage);
    }
  }

  submit() {
    this.formError = '';
    this.successMessage = '';
    const email = this.form.email.trim().toLowerCase();
    if (!email || !this.form.password.trim()) {
      this.formError = 'Please enter email and password.';
      this.toast.warning(this.formError);
      return;
    }
    this.isLoading = true;

    this.auth.login({ email, password: this.form.password }).subscribe({
      next: (res) => {
        const userRole = res.data.user.role;

        if (this.selectedRole === UserRoleLogin.HR && userRole === UserRole.APPLICANT) {
          this.formError = 'Email or password not correct!';
          this.toast.error(this.formError);
          this.isLoading = false;
          return;
        }

        if (this.selectedRole === UserRoleLogin.APPLICANT && userRole !== UserRole.APPLICANT) {
          this.formError = 'Email or password not correct!';
          this.toast.error(this.formError);
          this.isLoading = false;
          return;
        }

        // ==========================================
        // ĐIỂM CHẶN 2FA CHO HR NẰM Ở ĐÂY
        // ==========================================
        // if (this.selectedRole === UserRoleLogin.HR) {
        //   this.isLoading = false;
        //   this.tempLoginRes = res; // Lưu tạm cái cục token/data lại

        //   // Tạm thời bật giao diện SETUP_2FA để ông test UI.
        //   // Sau này Backend trả thêm cờ (vd: res.data.requires2FA) thì ông if/else ở đây
        //   this.currentStep = 'SETUP_2FA';
        //   return;
        // }

        // Nếu là Ứng viên thì vô thẳng như cũ
        this.toast.success('Login successful.');
        this.auth.handleLoginSuccess(res, this.selectedRole);
      },
      error: (err) => {
        const rawMessage = err?.error?.message || 'Email or password not correct!';
        this.formError =
          rawMessage === 'Account already registered. Check your email to verify.'
            ? 'Please verify your email first'
            : rawMessage;
        this.toast.error(this.formError);
        this.isLoading = false;
      },
    });
  }

  canShowResendVerify(): boolean {
    const email = this.form.email.trim();
    if (!email || this.selectedRole !== UserRoleLogin.APPLICANT) return false;
    const message = this.formError.toLowerCase();
    return (
      message.includes('please verify your email first') ||
      message.includes('account not verified')
    );
  }

  resendVerification() {
    const email = this.form.email.trim();
    if (!email || this.isResendingVerify) return;
    this.resendVerifyMessage = '';
    this.isResendingVerify = true;
    this.auth.resendVerify(email).subscribe({
      next: (res) => {
        this.isResendingVerify = false;
        this.resendVerifyMessage =
          res?.message ??
          'If your account exists, a verification link has been sent.';
      },
      error: (err) => {
        this.isResendingVerify = false;
        this.resendVerifyMessage =
          err?.error?.message ??
          'Unable to resend verification email. Please try again.';
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // --- HÀM XÁC THỰC MÃ 6 SỐ CỦA HR ---
  submit2FA() {
    this.formError = '';
    if (this.twoFactorCode.length !== 6) {
       this.formError = 'Mã xác thực phải gồm 6 chữ số.';
       return;
    }

    this.isLoading = true;

    // Giả lập gọi API /verify-2fa của anh Đức
    setTimeout(() => {
      this.isLoading = false;

      // Sau khi verify thành công, lấy cái cục data đã lưu tạm gọi hàm Success thật!
      if (this.tempLoginRes) {
        this.auth.handleLoginSuccess(this.tempLoginRes, this.selectedRole);
      } else {
        this.router.navigate(['/hr-portal']);
      }
    }, 1500);
  }
}

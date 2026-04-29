import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicantService } from '../../../core/services/applicant.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  // Mở rộng thêm nhiều trường dữ liệu cho ứng viên
  updateForm = {
    fullName: '',
    email: '',
    phone: '',
  };

  changePassForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  updateSuccessMessage = signal('');
  updateErrorMessage = signal('');

  changePasswordSuccessMessage = signal('');
  changePasswordErrorMessage = signal('');
  constructor(
    protected authService: AuthService,
    private applicantService: ApplicantService,
  ) {}
  ngOnInit() {
    // Thử load dữ liệu cũ nếu đã lưu
    this.updateForm = {
      fullName: this.authService.currentUser()?.fullName || '',
      email: this.authService.currentUser()?.email || '',
      phone: this.authService.currentUser()?.phone || '',
    };
  }

  submitUpdateForm() {
    if (
      this.updateForm.fullName === this.authService.currentUser()?.fullName &&
      this.updateForm.phone === this.authService.currentUser()?.phone
    ) {
      return;
    }
    this.applicantService.updateAccount(this.updateForm).subscribe({
      next: (res) => {
        this.authService.handleUpdateAccountSuccess(res);
        this.updateSuccessMessage.set('Profile details updated successfully.');
      },
      error: (err) => {
        this.updateErrorMessage.set(err.error.message);
      },
    });
    setTimeout(() => this.updateSuccessMessage.set(''), 5000);
  }

  submitChangePasswordForm() {
    this.applicantService.changePassword(this.changePassForm).subscribe({
      next: (res) => {
        this.changePasswordErrorMessage.set('');
        this.changePasswordSuccessMessage.set(res.message);
      },
      error: (err) => {
        this.changePasswordErrorMessage.set(err.error.message);
        this.changePasswordSuccessMessage.set('');
      },
    });
    setTimeout(() => {
      this.changePasswordErrorMessage.set('');
      this.changePasswordSuccessMessage.set('');
    }, 5000);
  }
}

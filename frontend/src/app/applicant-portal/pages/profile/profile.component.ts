import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ApplicantService } from '../../../core/services/applicant.service';
import { ToastService } from '../../../core/services/toast.service';
import { CV } from '../../../core/models';

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

  cvs = signal<CV[]>([]);
  isUploadingCv = signal(false);

  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  constructor(
    protected authService: AuthService,
    private applicantService: ApplicantService,
    private toast: ToastService,
  ) {}
  ngOnInit() {
    // Thử load dữ liệu cũ nếu đã lưu
    this.updateForm = {
      fullName: this.authService.currentUser()?.fullName || '',
      email: this.authService.currentUser()?.email || '',
      phone: this.authService.currentUser()?.phone || '',
    };

    this.applicantService
      .findAllCvByApplicantId(this.authService.currentUser()?.applicantId || '')
      .subscribe({
        next: (res) => {
          this.cvs.set(res.data);
        },
        error: (err) => {},
      });
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
        this.toast.success('Profile details updated successfully.');
        // this.updateSuccessMessage.set('Profile details updated successfully.');
      },
      error: (err) => {
        this.toast.error(err.error.message);
      },
    });
  }

  submitChangePasswordForm() {
    this.applicantService.changePassword(this.changePassForm).subscribe({
      next: (res) => {
        this.toast.success(res.message);
        this.changePassForm = {
          newPassword: '',
          currentPassword: '',
          confirmPassword: '',
        };
      },
      error: (err) => {
        this.toast.error(err.error.message);
      },
    });
  }

  uploadCv(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploadingCv.set(true);

    // LOGIC GỌI API THẬT
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'applicantId',
      this.authService.currentUser()?.applicantId || '',
    );

    // Run API:
    this.applicantService.uploadCv(formData).subscribe({
      next: (res: any) => {
        this.cvs.update((list) => [...list, res.data]);
        this.isUploadingCv.set(false);
        this.toast.success('Resume uploaded successfully!');
      },
      error: (err: any) => {
        this.isUploadingCv.set(false);
        this.toast.error(err.error?.message || 'Failed to upload Resume.');
      },
    });
  }

  deleteCv(id: string) {
    this.applicantService.deleteCv(id).subscribe({
      next: (res) => {
        this.cvs.update((list) => list.filter((cv) => cv.id !== id));
        this.toast.success(res.data);
      },
      error: (err) => this.toast.error(err.error.message),
    });
  }
}

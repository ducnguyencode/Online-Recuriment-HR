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
  successMessage = signal('');
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
    this.applicantService
      .updateAccount({
        fullName: this.updateForm.fullName,
        email: this.updateForm.email,
        phone: this.updateForm.phone,
      })
      .subscribe({
        next: (res) => {
          this.authService.handleUpdateAccountSuccess(res);
          this.successMessage.set('Profile details updated successfully.');
        },
        error: (err) => {
          this.successMessage.set(err.error.message);
        },
      });
    setTimeout(() => this.successMessage.set(''), 2500);
  }
}

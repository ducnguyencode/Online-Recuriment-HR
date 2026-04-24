import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
// import { ProfileService } from '../../../core/services/profile.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  toast = inject(ToastService);
  // profileService = inject(ProfileService);

  updateForm = { fullName: '', email: '', phone: '' };

  cvs = signal<any[]>([]);
  isUploadingCv = signal(false);

  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.updateForm = { fullName: user.fullName || '', email: user.email || '', phone: user.phone || '' };
    }
    // GỌI API GET LIST CV LÚC VÀO TRANG:
    // this.profileService.getMyCvs().subscribe(res => this.cvs.set(res.data));
  }

  submitUpdateForm() {
    // API Update User Information...
    this.toast.success('Profile and Security updated successfully!');
  }

  uploadCv(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    if (this.cvs().length >= 5) {
      this.toast.error('You can only upload a maximum of 5 Resumes.');
      return;
    }

    this.isUploadingCv.set(true);

    // LOGIC GỌI API THẬT
    const formData = new FormData();
    formData.append('file', file);

    /* MỞ COMMENT ĐỂ CHẠY API:
    this.profileService.uploadCv(formData).subscribe({
      next: (res: any) => {
        this.cvs.update(list => [...list, res.data]);
        this.isUploadingCv.set(false);
        this.toast.success('Resume uploaded successfully!');
      },
      error: (err: any) => {
        this.isUploadingCv.set(false);
        this.toast.error(err.error?.message || 'Failed to upload Resume.');
      }
    });
    */
  }

  deleteCv(id: string) {
    // LOGIC GỌI API XÓA THẬT:
    /*
    this.profileService.deleteCv(id).subscribe({
      next: () => {
        this.cvs.update(list => list.filter(cv => cv.id !== id));
        this.toast.success('Resume deleted successfully!');
      },
      error: () => this.toast.error('Failed to delete Resume.')
    });
    */

    // Tạm thời update State để ông test UI trước khi nối API
    this.cvs.update(list => list.filter(cv => cv.id !== id));
    this.toast.success('Resume deleted successfully!');
  }
}

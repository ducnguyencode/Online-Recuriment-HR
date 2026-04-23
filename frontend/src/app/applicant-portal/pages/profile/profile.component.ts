import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'] // (Hoặc .css tùy dự án của bạn)
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    // FORM 1: Xử lý Thông tin cá nhân
    this.profileForm = this.fb.group({
      fullName: ['Super Admin', Validators.required],
      role: [{ value: 'Super Admin', disabled: true }], // Disabled vì thường user không tự đổi Role
      email: ['admin@test.com', [Validators.required, Validators.email]],
      employeeId: [{ value: '---', disabled: true }],
      applicantId: [{ value: '---', disabled: true }]
    });

    // FORM 2: Xử lý Đổi mật khẩu
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });
  }

  // Hàm gọi API update Profile
  onSaveDetails() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    // getRawValue() lấy cả những trường bị disabled
    const profilePayload = this.profileForm.getRawValue();
    console.log('Gọi API PATCH /users/profile với data:', profilePayload);
    // TODO: Gắn service gọi API cập nhật thông tin tại đây
  }

  // Hàm gọi API đổi Password
  onUpdatePassword() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;

    // Validate phía FE trước khi gọi API
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      return;
    }

    const passwordPayload = { currentPassword, newPassword };
    console.log('Gọi API PUT /users/change-password với data:', passwordPayload);
    // TODO: Gắn service gọi API đổi mật khẩu tại đây

    // Đổi xong thì reset form cho sạch sẽ
    // this.passwordForm.reset();
  }
}

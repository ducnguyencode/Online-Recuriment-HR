import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  // Mở rộng thêm nhiều trường dữ liệu cho ứng viên
  candidate = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    title: '',
    bio: ''
  };

  successMessage = '';

  ngOnInit() {
    // Thử load dữ liệu cũ nếu đã lưu
    const savedProfile = localStorage.getItem('applicantProfile');
    if (savedProfile) {
      this.candidate = JSON.parse(savedProfile);
    } else {
      // Mock data hiển thị mặc định cho đẹp lúc demo
      this.candidate = {
        fullName: 'Nguyễn Phúc Nguyên Khang',
        email: 'khang.nguyen@example.com',
        phone: '0901234567',
        address: 'Hồ Chí Minh, Việt Nam',
        title: 'Frontend Developer',
        bio: 'Passionate frontend developer with experience in Angular and building beautiful user interfaces.'
      };
    }
  }

  onUpdate() {
    // Lưu toàn bộ cục data mới vào Local Storage
    localStorage.setItem('applicantProfile', JSON.stringify(this.candidate));

    // Lưu riêng cái tên để dùng cho Header/Dashboard
    localStorage.setItem('userFullName', this.candidate.fullName);

    this.successMessage = 'Profile updated successfully!';

    // Tự động tắt thông báo sau 3 giây
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}

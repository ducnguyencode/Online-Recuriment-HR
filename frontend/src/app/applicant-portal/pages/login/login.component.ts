import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  // viewMode sẽ có 3 trạng thái: 'login', 'register', 'forgot'
  viewMode: string = 'login';

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkRoute();
  }

  // Hàm này giúp component biết mình đang ở trang nào để hiện giao diện tương ứng
  checkRoute() {
    const currentUrl = this.router.url;
    if (currentUrl.includes('register')) {
      this.viewMode = 'register';
    } else if (currentUrl.includes('forgot-password')) {
      this.viewMode = 'forgot';
    } else {
      this.viewMode = 'login';
    }
  }

  // Hàm xử lý khi bấm nút Submit
  handleFormSubmit(event: Event) {
    event.preventDefault();
    let message = '';

    if (this.viewMode === 'login')
      message = 'Đăng nhập thành công! Đang vào Dashboard...';
    else if (this.viewMode === 'register')
      message = 'Đăng ký hoàn tất! Vui lòng xác thực Email.';
    else message = 'Yêu cầu đã gửi! Vui lòng kiểm tra hộp thư để đổi mật khẩu.';

    alert(message);
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {
  applicantName = 'Khang (Dev 5)';

  // Dữ liệu giả lập các lịch phỏng vấn trống (Lấy từ bảng INTERVIEWER_AVAILABILITY)
  availableSlots = [
    { time: '09:00 AM', date: '18/04/2026', available: true },
    { time: '02:00 PM', date: '18/04/2026', available: true },
    { time: '10:30 AM', date: '19/04/2026', available: true }
  ];

  confirmInterview(slot: any) {
    alert(`Đã chốt lịch phỏng vấn vào lúc ${slot.time} ngày ${slot.date}! Lên đồ thôi!`);
  }
}

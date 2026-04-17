import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Application {
  position: string;
  date: string;
  status: string;
  statusColor: string;
}

interface InterviewSlot {
  time: string;
  date: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {
  applications: Application[] = [
    { position: 'Senior Frontend Developer (Angular)', date: '15/04/2026', status: 'Interview Scheduled', statusColor: 'text-blue-500 bg-blue-50 border border-blue-100' },
    { position: 'Product Designer', date: '10/04/2026', status: 'Under Review', statusColor: 'text-slate-500 bg-slate-100 border border-slate-200' }
  ];

  interviewSlots: InterviewSlot[] = [
    { time: '09:00 AM', date: '18/04/2026' },
    { time: '02:00 PM', date: '18/04/2026' },
    { time: '10:30 AM', date: '19/04/2026' }
  ];

  selectedSlot: InterviewSlot | null = null;

  showToast = false;
  toastMessage = '';

  selectSlot(slot: InterviewSlot) {
    this.selectedSlot = slot;
    this.toastMessage = `Interview successfully scheduled for ${slot.time} on ${slot.date}! Get ready!`;
    this.showToast = true;

    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }
}

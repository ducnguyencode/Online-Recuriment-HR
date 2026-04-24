import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InterviewService } from '../../core/services/interview.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-my-availability',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './my-availability.component.html'
})
export class MyAvailabilityComponent implements OnInit {
    mySlots = signal<any[]>([]);
    employeeId = '';

    newSlot = { availableDate: '', startTime: '08:00', endTime: '17:00' };
    errorMsg = '';

    constructor(private interviewService: InterviewService, public auth: AuthService) { }

    ngOnInit() {
        this.employeeId = String(this.auth.currentUser()?.employeeId || '');

        if (this.employeeId) {
            this.loadMySlots();
        } else if (this.auth.isInterviewer()) {
            this.errorMsg = 'Error: No Employee Profile linked to this account.';
        }
    }

    loadMySlots() {
        this.interviewService.getAvailability({ employeeId: this.employeeId, startDate: '2024-01-01', endDate: '2030-12-31' })
            .subscribe(res => this.mySlots.set(res.data));
    }

    saveSlot() {
        if (!this.newSlot.availableDate) {
            this.errorMsg = 'Please select a date';
            return;
        }
        const payload = {
            employeeId: String(this.employeeId),
            ...this.newSlot
        };
        this.interviewService.addAvailability(payload).subscribe({
            next: () => {
                this.errorMsg = '';
                this.loadMySlots();
            },
            error: (err) => this.errorMsg = err.error.message || 'Error saving slot'
        });
    }

    deleteSlot(id: string) {
        if (confirm('Are you sure you want to remove this slot?')) {
            this.interviewService.deleteAvailability(id).subscribe(() => this.loadMySlots());
        }
    }
}
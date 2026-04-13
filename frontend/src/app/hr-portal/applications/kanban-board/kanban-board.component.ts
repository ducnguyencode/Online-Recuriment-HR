import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { catchError, forkJoin, of } from 'rxjs';
import { ApplicationService } from '../../../core/services/application.service';
import { InterviewService, ScheduleInterviewDto } from '../../../core/services/interview.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { Application, Vacancy, Employee, ApplicationStatus, canAttachToVacancy } from '../../../core/models';

interface KanbanColumn {
  id: string;
  title: string;
  status: ApplicationStatus;
  color: string;
  items: Application[];
}

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, CdkDropList, CdkDrag, DatePipe, RouterLink],
  templateUrl: './kanban-board.component.html',
  styleUrl: './kanban-board.component.scss',
})
export class KanbanBoardComponent implements OnInit {
  vacancies = signal<Vacancy[]>([]);
  selectedVacancyId = signal<string>('');
  columns = signal<KanbanColumn[]>([]);
  loading = signal(false);

  // CV Detail dialog
  showCVDetail = signal(false);
  selectedApp = signal<Application | null>(null);

  // Schedule interview dialog
  showInterviewDialog = signal(false);
  /** Interviewers filtered by the selected vacancy's department — per spec */
  availableInterviewers = signal<Employee[]>([]);
  selectedPanelIds: string[] = [];

  interviewData = {
    applicationId: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    platform: 'Google Meet' as 'Google Meet' | 'Zoom' | 'On-site',
  };
  interviewError = '';
  availabilityPreview = signal<Record<string, { availableDate: string; startTime: string; endTime: string }[]>>({});

  connectedLists = ['pending', 'screening', 'interview', 'selected', 'rejected'];

  constructor(
    private appService: ApplicationService,
    private interviewService: InterviewService,
    private employeeService: EmployeeService,
    private mockData: MockDataService,
  ) {}

  ngOnInit() {
    const raw = this.mockData.getVacancies({ status: 'Open' });
    const vacs = raw.map(v => ({
      ...v, id: String(v.id), departmentId: String(v.departmentId),
      ownedByEmployeeId: String(v.ownedByEmployeeId),
      numberOfOpenings: (v as any).openings ?? 1,
      closingDate: (v as any).deadline ?? '',
    })) as unknown as Vacancy[];
    this.vacancies.set(vacs);
    if (vacs.length > 0) {
      this.selectedVacancyId.set('');
      this.loadKanban();
    }
  }

  get selectedVacancy(): Vacancy | undefined {
    return this.vacancies().find(v => v.id === this.selectedVacancyId());
  }

  onVacancyChange() { this.loadKanban(); }

  loadKanban() {
    this.loading.set(true);
    const vacId = this.selectedVacancyId() || undefined;

    this.appService.getAll({ vacancyId: vacId }).subscribe({
      next: res => {
        const items: Application[] = (res.data as any)?.items ?? [];
        this.buildColumns(items);
        this.loading.set(false);
      },
      error: () => {
        const raw = this.mockData.getApplications(vacId ? { vacancyId: vacId } : {});
        const items = raw.map(a => ({
          ...a, id: String(a.id), applicantId: String(a.applicantId),
          vacancyId: String(a.vacancyId),
        })) as unknown as Application[];
        this.buildColumns(items);
        this.loading.set(false);
      }
    });
  }

  private buildColumns(apps: Application[]) {
    this.columns.set([
      { id: 'pending',   title: 'Pending',            status: 'Pending',            color: '#94A3B8', items: apps.filter(a => a.status === 'Pending') },
      { id: 'screening', title: 'Screening',           status: 'Screening',          color: '#F59E0B', items: apps.filter(a => a.status === 'Screening') },
      { id: 'interview', title: 'Interview Scheduled', status: 'Interview Scheduled', color: '#3B82F6', items: apps.filter(a => a.status === 'Interview Scheduled') },
      { id: 'selected',  title: 'Selected',            status: 'Selected',           color: '#22C55E', items: apps.filter(a => a.status === 'Selected') },
      { id: 'rejected',  title: 'Rejected',            status: 'Rejected',           color: '#EF4444', items: apps.filter(a => a.status === 'Rejected') },
    ]);
  }

  onDrop(event: CdkDragDrop<Application[]>, targetColumn: KanbanColumn) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    // Business rule: cannot move to Selected if vacancy is Closed/Suspended
    if (targetColumn.status === 'Selected' && this.selectedVacancy) {
      if (!canAttachToVacancy(this.selectedVacancy.status)) {
        alert('Cannot select applicant — vacancy is ' + this.selectedVacancy.status);
        return;
      }
    }

    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    const movedApp = event.container.data[event.currentIndex];

    // Update status on the local object so template bindings re-evaluate immediately
    movedApp.status = targetColumn.status;

    this.appService.changeStatus(movedApp.id, targetColumn.status).subscribe({
      error: () => this.mockData.updateApplicationStatus(movedApp.id, targetColumn.status)
    });
  }

  openCVDetail(app: Application) { this.selectedApp.set(app); this.showCVDetail.set(true); }
  closeCVDetail() { this.showCVDetail.set(false); this.selectedApp.set(null); }

  // ── Schedule Interview ─────────────────────────────────────────────────────

  openInterviewDialog(app: Application, event: Event) {
    event.stopPropagation();
    this.interviewData = {
      applicationId: app.id,
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow min
      startTime: '09:00', endTime: '10:00',
      platform: 'Google Meet',
    };
    this.selectedPanelIds = [];
    this.interviewError = '';
    this.availabilityPreview.set({});

    // Load interviewers from same department as the vacancy (per spec)
    const deptId = app.vacancy?.departmentId ?? this.selectedVacancy?.departmentId ?? '';
    if (deptId) {
      this.employeeService.getInterviewersByDepartment(deptId).subscribe({
        next: res => this.availableInterviewers.set(Array.isArray(res.data) ? res.data : []),
        error: () => this.availableInterviewers.set(this.getMockInterviewers())
      });
    } else {
      this.availableInterviewers.set(this.getMockInterviewers());
    }

    this.showInterviewDialog.set(true);
  }

  closeInterviewDialog() { this.showInterviewDialog.set(false); this.interviewError = ''; this.availabilityPreview.set({}); }

  togglePanelMember(employeeId: string) {
    const idx = this.selectedPanelIds.indexOf(employeeId);
    if (idx === -1) this.selectedPanelIds.push(employeeId);
    else this.selectedPanelIds.splice(idx, 1);
    this.loadAvailabilityPreview();
  }

  isPanelSelected(employeeId: string): boolean {
    return this.selectedPanelIds.includes(employeeId);
  }

  onInterviewDateChange() {
    this.loadAvailabilityPreview();
  }

  loadAvailabilityPreview() {
    if (!this.interviewData.date || this.selectedPanelIds.length === 0) {
      this.availabilityPreview.set({});
      return;
    }

    const requests = this.selectedPanelIds.map(employeeId =>
      this.interviewService.getAvailability({
        employeeId,
        startDate: this.interviewData.date,
        endDate: this.interviewData.date,
      }).pipe(
        catchError(() => of({ data: this.mockData.getAvailability(employeeId, this.interviewData.date, this.interviewData.date) } as any))
      )
    );

    forkJoin(requests).subscribe(results => {
      const preview: Record<string, { availableDate: string; startTime: string; endTime: string }[]> = {};
      results.forEach((result, index) => {
        preview[this.selectedPanelIds[index]] = (result.data ?? []).map((slot: any) => ({
          availableDate: slot.availableDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }));
      });
      this.availabilityPreview.set(preview);
    });
  }

  getEmployeeName(employeeId: string): string {
    return this.availableInterviewers().find(item => item.id === employeeId)?.fullName ?? employeeId;
  }

  hasValidAvailability(): boolean {
    return this.selectedPanelIds.every(employeeId => {
      const slots = this.availabilityPreview()[employeeId] ?? [];
      return slots.some(slot => this.interviewData.startTime >= slot.startTime && this.interviewData.endTime <= slot.endTime);
    });
  }

  private scrollDialogToTop() {
    setTimeout(() => {
      const el = document.querySelector('.modal-content');
      if (el) el.scrollTop = 0;
    }, 0);
  }

  saveInterview() {
    const { applicationId, date, startTime, endTime, platform } = this.interviewData;

    if (!date || !startTime || !endTime) {
      this.interviewError = 'Date, start time and end time are required.';
      this.scrollDialogToTop(); return;
    }
    if (new Date(date + 'T00:00:00') <= new Date()) {
      this.interviewError = 'Interview date must be in the future.';
      this.scrollDialogToTop(); return;
    }
    if (startTime >= endTime) {
      this.interviewError = 'End time must be after start time.';
      this.scrollDialogToTop(); return;
    }
    if (this.selectedPanelIds.length === 0) {
      this.interviewError = 'Select at least one interviewer from the panel.';
      this.scrollDialogToTop(); return;
    }

    const conflicts = this.mockData.getInterviewerConflicts(this.selectedPanelIds, date, startTime, endTime);
    if (conflicts.length > 0) {
      this.interviewError = `Conflict detected: ${conflicts.join(', ')} already has an interview scheduled at this time.`;
      this.scrollDialogToTop(); return;
    }

    const dto: ScheduleInterviewDto = {
      applicationId,
      panel: this.selectedPanelIds.map(id => ({
        employeeId: id,
        role: this.availableInterviewers().find(e => e.id === id)?.position ?? 'Interviewer'
      })),
      interviewDate: date,
      startTime, endTime, platform,
    };

    this.interviewService.schedule(dto).subscribe({
      next: () => {
        this.closeInterviewDialog();
        this.loadKanban();
      },
      error: () => {
        // Mock fallback
        const dur = (new Date(`2000-01-01T${endTime}`) .getTime() - new Date(`2000-01-01T${startTime}`).getTime()) / 60000;
        this.mockData.addInterview({ applicationId, date, time: startTime, duration: dur, platform, interviewers: this.selectedPanelIds });
        this.closeInterviewDialog();
        this.loadKanban();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getScoreClass(score: number | undefined): string {
    if (!score) return 'score-low';
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).slice(-2).join('').toUpperCase();
  }

  private getMockInterviewers(): Employee[] {
    return [
      { id: 'emp-uuid-001', fullName: 'Nguyen Van An', email: 'an@abc.com', departmentId: '1', position: 'Tech Lead', role: 'Interviewer' },
      { id: 'emp-uuid-003', fullName: 'Le Van Cuong', email: 'cuong@abc.com', departmentId: '1', position: 'Senior Dev', role: 'Interviewer' },
    ];
  }
}

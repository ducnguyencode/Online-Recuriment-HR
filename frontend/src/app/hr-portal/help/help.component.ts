import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Help</h1>
          <p class="page-subtitle">Quick guidance for HR users working with vacancies, applicants, and interviews.</p>
        </div>
      </div>

      <div class="help-grid">
        <section class="card help-card">
          <h2 class="help-title">Vacancies</h2>
          <ul class="help-list">
            <li>Create and update vacancies from the Vacancies page.</li>
            <li>Only the owner can close or suspend their vacancy.</li>
            <li>Closed vacancies cannot be reopened.</li>
          </ul>
        </section>

        <section class="card help-card">
          <h2 class="help-title">Applicants</h2>
          <ul class="help-list">
            <li>Create applicants manually if they are not self-registered yet.</li>
            <li>Review AI-parsed CV data before attaching an applicant to a vacancy.</li>
            <li>Applicants marked Hired or Banned cannot be attached to new vacancies.</li>
          </ul>
        </section>

        <section class="card help-card">
          <h2 class="help-title">Applications & Kanban</h2>
          <ul class="help-list">
            <li>Attach applicants to vacancies in the Applications page.</li>
            <li>Use Kanban Board to move candidates between pipeline stages.</li>
            <li>Use the Application record to schedule interviews.</li>
          </ul>
        </section>

        <section class="card help-card">
          <h2 class="help-title">Interviews</h2>
          <ul class="help-list">
            <li>Schedule interviews only in future time slots.</li>
            <li>Preview interviewer availability before saving the interview.</li>
            <li>HR can reschedule/cancel, interviewer can submit results.</li>
          </ul>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .help-grid { display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:16px; }
    .help-card { padding: 20px; }
    .help-title { margin:0 0 10px; color: var(--shell-text-strong); font-size:16px; font-weight:600; }
    .help-list { margin:0; padding-left:18px; color: var(--shell-text); font-size:13px; line-height:1.7; }
    @media (max-width: 900px) { .help-grid { grid-template-columns: 1fr; } }
  `]
})
export class HelpComponent {}

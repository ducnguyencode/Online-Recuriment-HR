import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-LProfile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">My Profile</h1>
          <p class="page-subtitle">
            Update personal details and change your password after login.
          </p>
        </div>
      </div>

      <div class="profile-grid">
        <section class="card panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Personal Details</h2>
              <p class="panel-copy">
                These details are shown in the HR portal header and internal
                account record.
              </p>
            </div>
            <div class="profile-avatar">{{ initials() }}</div>
          </div>

          @if (detailMessage()) {
            <div class="info-banner info-banner-info">
              {{ detailMessage() }}
            </div>
          }

          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input class="form-input" [(ngModel)]="detailForm.fullName" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input class="form-input" [(ngModel)]="detailForm.email" />
            </div>
            <div class="form-group">
              <label class="form-label">Role</label>
              <input
                class="form-input"
                [ngModel]="auth.currentUser()?.role"
                disabled
              />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Employee ID</label>
              <input
                class="form-input"
                [ngModel]="auth.currentUser()?.employeeId || '—'"
                disabled
              />
            </div>
            <div class="form-group">
              <label class="form-label">Applicant ID</label>
              <input
                class="form-input"
                [ngModel]="auth.currentUser()?.applicantId || '—'"
                disabled
              />
            </div>
          </div>

          <div class="panel-actions">
            <button class="btn-primary" (click)="saveDetails()">
              Save Details
            </button>
          </div>
        </section>

        <section class="card panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Change Password</h2>
              <p class="panel-copy">
                Update your password to keep your account secure.
              </p>
            </div>
          </div>

          @if (passwordMessage()) {
            <div class="info-banner info-banner-info">
              {{ passwordMessage() }}
            </div>
          }

          @if (passwordError()) {
            <div class="form-error-banner">{{ passwordError() }}</div>
          }

          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input
              class="form-input"
              type="password"
              [(ngModel)]="passwordForm.currentPassword"
            />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input
                class="form-input"
                type="password"
                [(ngModel)]="passwordForm.newPassword"
              />
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input
                class="form-input"
                type="password"
                [(ngModel)]="passwordForm.confirmPassword"
              />
            </div>
          </div>

          <div class="panel-actions">
            <button class="btn-primary" (click)="changePassword()">
              Update Password
            </button>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
      }
      .panel {
        padding: 20px;
      }
      .panel-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 16px;
      }
      .panel-title {
        margin: 0 0 4px;
        font-size: 16px;
        font-weight: 600;
        color: var(--shell-text-strong);
      }
      .panel-copy {
        margin: 0;
        color: var(--shell-text-soft);
        font-size: 12px;
        line-height: 1.6;
      }
      .panel-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
      }
      .profile-avatar {
        width: 44px;
        height: 44px;
        border-radius: 16px;
        background: var(--shell-brand-soft);
        color: var(--shell-brand);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        flex-shrink: 0;
      }
      @media (max-width: 900px) {
        .profile-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ProfileComponent {
  detailMessage = signal('');
  passwordMessage = signal('');
  passwordError = signal('');

  detailForm = {
    fullName: '',
    email: '',
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  constructor(
    public auth: AuthService,
    private employeeService: EmployeeService,
  ) {
    this.detailForm = {
      fullName: this.auth.currentUser()?.fullName ?? '',
      email: this.auth.currentUser()?.email ?? '',
    };
  }

  initials() {
    return (
      this.auth
        .currentUser()
        ?.fullName?.split(' ')
        .map((part) => part[0])
        .slice(-2)
        .join('')
        .toUpperCase() || '?'
    );
  }

  saveDetails() {
    this.employeeService
      .updateAccount({
        fullName: this.detailForm.fullName,
        email: this.detailForm.email,
      })
      .subscribe({
        next: (res) => {
          this.auth.handleUpdateAccountSuccess(res);
          this.detailMessage.set('Profile details updated successfully.');
        },
        error: (err) => {
          this.detailMessage.set(err.error.message);
        },
      });
    setTimeout(() => this.detailMessage.set(''), 2500);
  }

  changePassword() {
    this.passwordError.set('');
    this.passwordMessage.set('');

    if (
      !this.passwordForm.currentPassword ||
      !this.passwordForm.newPassword ||
      !this.passwordForm.confirmPassword
    ) {
      this.passwordError.set('All password fields are required.');
      return;
    }
    if (this.passwordForm.currentPassword !== '123456') {
      this.passwordError.set(
        'Current password is incorrect for the mock account.',
      );
      return;
    }
    if (this.passwordForm.newPassword.length < 6) {
      this.passwordError.set('New password must be at least 6 characters.');
      return;
    }
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.passwordError.set('Password confirmation does not match.');
      return;
    }

    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    this.passwordMessage.set(
      'Password updated successfully in the mock workflow.',
    );
    setTimeout(() => this.passwordMessage.set(''), 2500);
  }
}

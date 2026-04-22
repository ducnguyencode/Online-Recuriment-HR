import { Component, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models';

@Component({
  selector: 'app-verify-page',
  imports: [],
  templateUrl: './verify-page.component.html',
  styleUrl: './verify-page.component.scss',
})
export class VerifyPageComponent {
  readonly title = signal('Verifying your email...');
  readonly description = signal(
    'Please wait while we validate your verification token.',
  );
  readonly actionLabel = signal('Return to login');
  readonly verifiedEmail = signal<string | null>(null);
  readonly goToInitialPassword = signal(false);
  private token: string | null = null;

  constructor(
    private router: Router,
    route: ActivatedRoute,
    authService: AuthService,
  ) {
    this.token = route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.title.set('Verification token is missing');
      this.description.set('Open the verification link from your email again.');
      return;
    }

    authService.verifyEmail(this.token).subscribe({
      next: (res) => {
        this.verifiedEmail.set(res.data?.email ?? null);
        if (
          res.data?.role === UserRole.HR ||
          res.data?.role === UserRole.INTERVIEWER
        ) {
          this.title.set('Email verified');
          this.description.set(
            'Your staff invite has been confirmed. Create your initial password to finish activating the account.',
          );
          this.actionLabel.set('Set initial password');
          this.goToInitialPassword.set(true);
          return;
        }

        this.title.set('Email verified');
        this.description.set(res.message);
      },
      error: (err) => {
        this.title.set('Verification failed');
        this.description.set(
          err.error?.message ?? 'The verification link is invalid.',
        );
      },
    });
  }

  handlePrimaryAction() {
    if (this.goToInitialPassword() && this.token) {
      this.router.navigate(['/set-initial-password'], {
        queryParams: {
          token: this.token,
          email: this.verifiedEmail() ?? undefined,
        },
      });
      return;
    }
    this.router.navigate(['/login']);
  }
}

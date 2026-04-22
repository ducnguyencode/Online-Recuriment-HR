import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole, UserRoleLogin } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Expose enum to HTML template
  UserRoleLogin = UserRoleLogin;

  selectedRole: UserRoleLogin = UserRoleLogin.APPLICANT;
  form = { email: '', password: '' };
  formError = '';
  isLoading = false;

  ngOnInit(): void {
    const path = this.router.url;
    this.selectedRole = path.includes('hr/login') ? UserRoleLogin.HR : UserRoleLogin.APPLICANT;
  }

  submit() {
    this.formError = '';
    this.isLoading = true;

    this.auth.login(this.form).subscribe({
      next: (res) => {
        const userRole = res.data.user.role;

        if (this.selectedRole === UserRoleLogin.HR && userRole === UserRole.APPLICANT) {
          this.formError = 'This account is for applicants. Please use the Applicant Login.';
          this.isLoading = false;
          return;
        }

        if (this.selectedRole === UserRoleLogin.APPLICANT && userRole !== UserRole.APPLICANT) {
          this.formError = 'This account is for HR. Please use the HR Portal Login.';
          this.isLoading = false;
          return;
        }

        this.auth.handleLoginSuccess(res, this.selectedRole);
      },
      error: (err) => {
        this.formError = err.error?.message || 'Invalid email or password';
        this.isLoading = false;
      },
    });
  }
}

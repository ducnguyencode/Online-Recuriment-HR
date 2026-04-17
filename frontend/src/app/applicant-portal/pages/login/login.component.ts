import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type AuthView = 'login' | 'register' | 'forgot';
type UserRole = 'applicant' | 'hr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  currentView: AuthView = 'login';
  selectedRole: UserRole = 'applicant';

  switchView(view: AuthView) {
    this.currentView = view;
    if (view === 'register') {
      this.selectedRole = 'applicant';
    }
  }

  setRole(role: UserRole) {
    this.selectedRole = role;
  }
}

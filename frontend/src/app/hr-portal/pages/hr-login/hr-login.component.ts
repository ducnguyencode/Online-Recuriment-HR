import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-hr-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hr-login.component.html',
  styleUrls: ['./hr-login.component.scss']
})
export class HrLoginComponent {
  // Inject Router for programmatic navigation after login
  private router = inject(Router);

  // Handle HR login form submission
  onSubmit() {
    // TODO: Implement real authentication API call using AuthService here
    console.log('HR Admin authentication in progress...');

    // Mock successful login behavior: Redirect to the HR Portal
    this.router.navigate(['/hr-portal']);
  }
}

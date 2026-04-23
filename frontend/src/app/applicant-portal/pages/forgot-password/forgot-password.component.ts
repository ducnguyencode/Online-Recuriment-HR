import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  email: string = '';
  isLoading = false;
  isSent = false;

  /**
   * Handle the forgot password request and simulate email sending
   */
  sendResetLink() {
    if (!this.email) return;

    this.isLoading = true;
    // Simulate API delay for demo purposes
    setTimeout(() => {
      this.isLoading = false;
      this.isSent = true;
      alert('A password reset link has been sent to: ' + this.email);
    }, 1500);
  }
}

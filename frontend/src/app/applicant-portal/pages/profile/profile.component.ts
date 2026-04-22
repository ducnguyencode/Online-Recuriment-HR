import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  candidate = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    experience: ''
  };
  successMessage: string = '';

  ngOnInit(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.candidate = JSON.parse(userData);
    }
  }

  onUpdateProfile(): void {
    localStorage.setItem('currentUser', JSON.stringify(this.candidate));
    this.successMessage = 'Profile updated successfully!';
    setTimeout(() => this.successMessage = '', 3000);
  }
}

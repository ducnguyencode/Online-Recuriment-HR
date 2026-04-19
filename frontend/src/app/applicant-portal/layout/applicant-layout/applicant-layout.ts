import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // Thêm cái này

@Component({
  selector: 'app-applicant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule], // Nhét nó vào đây
  templateUrl: './applicant-layout.html',
  styleUrls: ['./applicant-layout.scss'],
})
export class ApplicantLayoutComponent {}

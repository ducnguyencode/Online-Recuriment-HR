import {
  Component,
  computed,
  inject,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserAccount } from '../../../core/models';

@Component({
  selector: 'app-applicant-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './applicant-layout.html',
  styleUrls: ['./applicant-layout.scss'],
})
export class ApplicantLayoutComponent implements OnInit {
  auth = inject(AuthService);

  constructor() {}
  ngOnInit(): void {}
  logout() {
    this.auth.logout();
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // 1. Import RouterModule for routing features

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterModule], // 2. Add RouterModule to the imports array
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

}

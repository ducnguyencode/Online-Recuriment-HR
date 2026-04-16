import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

interface Job {
  id: string; title: string; department: string; location: string; type: string; salary: string; skills: string[]; postedDate: string;
}

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './careers.html',
  styleUrls: ['./careers.scss']
})
export class CareersComponent implements OnInit {
  jobs: Job[] = [
    { id: 'VAC-001', title: 'Senior Frontend Developer (Angular)', department: 'Engineering', location: 'Hồ Chí Minh', type: 'Full-time', salary: '$1500 - $2500', skills: ['Angular', 'TypeScript', 'Tailwind CSS'], postedDate: '15/04/2026' },
    { id: 'VAC-002', title: 'Backend Developer (NestJS)', department: 'Engineering', location: 'Hà Nội', type: 'Full-time', salary: '$1200 - $2000', skills: ['Node.js', 'NestJS', 'PostgreSQL'], postedDate: '12/04/2026' },
    { id: 'VAC-003', title: 'Product Designer (UI/UX)', department: 'Design', location: 'Remote', type: 'Full-time', salary: 'Thỏa thuận', skills: ['Figma', 'Prototyping', 'User Research'], postedDate: '10/04/2026' }
  ];

  isModalOpen = false;
  selectedJobTitle = '';

  constructor(private titleService: Title, private metaService: Meta) {}

  ngOnInit() {
    this.titleService.setTitle('Cơ Hội Việc Làm | Tuyển Dụng Công Nghệ');
    this.metaService.updateTag({ name: 'description', content: 'Khám phá các vị trí tuyển dụng hấp dẫn tại công ty.' });
  }

  openApplyModal(jobTitle: string) {
    this.selectedJobTitle = jobTitle;
    this.isModalOpen = true;
  }

  closeApplyModal() {
    this.isModalOpen = false;
  }

  submitApplication(event: Event) {
    event.preventDefault();
    alert('🎉 Nộp CV thành công! Dữ liệu đã được chuyển đến bộ phận HR để bóc tách AI.');
    this.closeApplyModal();
  }
}

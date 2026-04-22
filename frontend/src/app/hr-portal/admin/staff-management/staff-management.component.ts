import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminUserService,
  CreateStaffAccountDto,
} from '../../../core/services/admin-user.service';
import { DepartmentService } from '../../../core/services/department.service';
import {
  Department,
  Employee,
  UserAccount,
  UserRole,
} from '../../../core/models';
import {
  CreateEmployeeDto,
  EmployeeService,
} from '../../../core/services/employee.service';

type StaffRole = Extract<UserRole, 'HR' | 'Interviewer'>;

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-management.component.html',
  styleUrl: './staff-management.component.scss',
})
export class StaffManagementComponent implements OnInit {
  UserRole = UserRole;
  employees = signal<Employee[]>([]);
  departments = signal<Department[]>([]);
  loading = signal(false);
  errorMsg = signal('');
  totalItems = signal(0);
  totalPages = signal(1);
  currentPage = signal(1);
  readonly pageSize = 15;

  filterRole = signal<'' | StaffRole>('');
  filterDepartment = signal('');
  searchQuery = signal('');

  showCreateDialog = signal(false);
  creating = signal(false);
  formError = signal('');
  formSuccess = signal('');
  formData: CreateStaffAccountDto = {
    email: '',
    fullName: '',
    role: UserRole.HR,
    departmentId: '',
    position: '',
    phone: '',
  };

  constructor(
    private adminService: AdminUserService,
    private departmentService: DepartmentService,
    private employeeService: EmployeeService,
  ) {}

  ngOnInit() {
    this.loadDepartments();
    this.loadUsers();
  }

  loadDepartments() {
    this.departmentService.getAll().subscribe({
      next: (res) =>
        this.departments.set(Array.isArray(res.data) ? res.data : []),
      error: () => this.departments.set([]),
    });
  }

  loadUsers() {
    this.loading.set(true);
    this.errorMsg.set('');
    this.employeeService
      .getAll({
        role: this.filterRole() || undefined,
        departmentId: this.filterDepartment() || undefined,
        search: this.searchQuery().trim() || undefined,
        page: this.currentPage(),
        limit: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          const items = (res.data as any)?.items ?? [];
          const totalItems =
            (res.data as any)?.totalItems ??
            (res.data as any)?.total ??
            items.length;
          const totalPages =
            (res.data as any)?.totalPage ??
            (res.data as any)?.totalPages ??
            Math.max(1, Math.ceil(totalItems / this.pageSize));
          this.employees.set(items);
          this.totalItems.set(totalItems);
          this.totalPages.set(totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.employees.set([]);
          this.totalItems.set(0);
          this.totalPages.set(1);
          this.errorMsg.set('');
          this.loading.set(false);
        },
      });
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  clearFilters() {
    this.filterRole.set('');
    this.filterDepartment.set('');
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.loadUsers();
  }

  goToPage(page: number) {
    this.currentPage.set(Math.max(1, Math.min(page, this.totalPages())));
    this.loadUsers();
  }

  openCreateDialog() {
    this.formData = {
      email: '',
      fullName: '',
      role: UserRole.HR,
      departmentId: '',
      position: '',
      phone: '',
    };
    this.formError.set('');
    this.formSuccess.set('');
    this.showCreateDialog.set(true);
  }

  closeCreateDialog() {
    this.showCreateDialog.set(false);
    this.formError.set('');
    this.formSuccess.set('');
  }

  saveStaff() {
    const email = this.formData.email.trim();
    const fullName = this.formData.fullName.trim();

    if (!email) {
      this.formError.set('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.formError.set('Invalid email format.');
      return;
    }
    if (!fullName) {
      this.formError.set('Full name is required.');
      return;
    }
    if (!this.formData.departmentId) {
      this.formError.set('Department is required.');
      return;
    }

    const dto: CreateEmployeeDto = {
      ...this.formData,
      email,
      fullName,
      departmentId: this.formData.departmentId,
      jobTitle: this.formData.position?.trim() || undefined,
      phone: this.formData.phone?.trim() || undefined,
    };

    this.creating.set(true);
    this.formError.set('');
    this.employeeService.create(dto).subscribe({
      next: () => {
        this.creating.set(false);
        this.formSuccess.set(
          `Invitation sent to ${email}. ` +
            `After verifying the email, the user will set an initial password before signing in.`,
        );
        this.loadUsers();
      },
      error: (err) => {
        this.creating.set(false);
        this.formError.set(
          err?.error?.message ??
            'Unable to create the staff account. Please try again.',
        );
      },
    });
  }

  resendCredentials(user: UserAccount | undefined) {
    if (!user) return;
    if (!confirm(`Resend the activation email to ${user.email}?`)) return;
    this.adminService.resendTemporaryPassword(user.id).subscribe({
      next: () =>
        this.formSuccess.set(
          `A new activation email has been sent to ${user.email}.`,
        ),
      error: (err) =>
        this.errorMsg.set(
          err?.error?.message ??
            'Unable to resend credentials. Please try again.',
        ),
    });
  }

  toggleActive(user: UserAccount | undefined) {
    if (!user) return;
    const fn = user.isActive
      ? this.adminService.deactivate(user.id)
      : this.adminService.activate(user.id);
    fn.subscribe({
      next: () => this.loadUsers(),
      error: (err) =>
        this.errorMsg.set(
          err?.error?.message ??
            'Unable to update the account status. Please try again.',
        ),
    });
  }

  roleBadgeClass(role?: string): string {
    if (role === 'HR') return 'badge-info';
    if (role === 'Interviewer') return 'badge-warning';
    if (role === 'Superadmin') return 'badge-success';
    return 'badge-neutral';
  }

  getInitials(name: string | undefined): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n.charAt(0))
      .slice(-2)
      .join('')
      .toUpperCase();
  }
}

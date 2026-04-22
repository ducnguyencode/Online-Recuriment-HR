import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminUserService,
  CreateStaffAccountDto,
  UpdateStaffAccountDto,
} from '../../../core/services/admin-user.service';
import { DepartmentService } from '../../../core/services/department.service';
import { Department, UserRole } from '../../../core/models';

type StaffRole = Extract<UserRole, 'HR' | 'Interviewer'>;
type StaffAccountRow = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  createdAt?: string | Date;
  phone?: string;
  departmentId?: string;
  departmentName?: string;
  position?: string;
};

@Component({
  selector: 'app-staff-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './staff-management.component.html',
  styleUrl: './staff-management.component.scss',
})
export class StaffManagementComponent implements OnInit {
  UserRole = UserRole;
  staffAccounts = signal<StaffAccountRow[]>([]);
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
  editingUserId = signal<string | null>(null);

  constructor(
    private adminService: AdminUserService,
    private departmentService: DepartmentService,
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
    this.adminService
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
          this.staffAccounts.set(
            items.map((row: any) => ({
              id: String(row.id),
              fullName: row.fullName,
              email: row.email,
              role: row.role,
              isVerified: !!row.isVerified,
              isActive: !!row.isActive,
              createdAt: row.createdAt,
              phone: row.phone ?? '',
              departmentId: row.employee?.department?.id
                ? String(row.employee.department.id)
                : '',
              departmentName: row.employee?.department?.name ?? '',
              position: row.employee?.jobTitle ?? '',
            })),
          );
          this.totalItems.set(totalItems);
          this.totalPages.set(totalPages);
          this.loading.set(false);
        },
        error: () => {
          this.staffAccounts.set([]);
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
    this.editingUserId.set(null);
    this.showCreateDialog.set(true);
  }

  openEditDialog(staff: StaffAccountRow) {
    this.formData = {
      email: staff.email,
      fullName: staff.fullName,
      role: staff.role as StaffRole,
      departmentId: staff.departmentId ?? '',
      position: staff.position ?? '',
      phone: staff.phone ?? '',
    };
    this.formError.set('');
    this.formSuccess.set('');
    this.editingUserId.set(staff.id);
    this.showCreateDialog.set(true);
  }

  closeCreateDialog() {
    this.showCreateDialog.set(false);
    this.formError.set('');
    this.formSuccess.set('');
    this.editingUserId.set(null);
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

    const createDto: CreateStaffAccountDto = {
      ...this.formData,
      email,
      fullName,
      departmentId: this.formData.departmentId,
      position: this.formData.position?.trim() || undefined,
      phone: this.formData.phone?.trim() || undefined,
    };
    const updateDto: UpdateStaffAccountDto = {
      fullName,
      role: this.formData.role,
      departmentId: this.formData.departmentId,
      position: this.formData.position?.trim() || undefined,
      phone: this.formData.phone?.trim() || undefined,
    };

    this.creating.set(true);
    this.formError.set('');
    const editingUserId = this.editingUserId();
    const request$ = editingUserId
      ? this.adminService.updateStaff(editingUserId, updateDto)
      : this.adminService.createStaff(createDto);
    request$.subscribe({
      next: () => {
        this.creating.set(false);
        this.formSuccess.set(
          editingUserId
            ? 'Staff account updated successfully.'
            : `Account created. An activation email has been sent to ${email}.`,
        );
        this.closeCreateDialog();
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

  resendCredentials(staff: StaffAccountRow | undefined) {
    if (!staff) return;
    if (!confirm(`Resend activation email to ${staff.email}?`)) return;
    this.adminService.resendTemporaryPassword(staff.id).subscribe({
      next: () =>
        this.formSuccess.set(
          `Activation email has been sent to ${staff.email}.`,
        ),
      error: (err) =>
        this.errorMsg.set(
          err?.error?.message ??
            'Unable to resend credentials. Please try again.',
        ),
    });
  }

  toggleActive(staff: StaffAccountRow | undefined) {
    if (!staff) return;
    const fn = staff.isActive
      ? this.adminService.deactivate(staff.id)
      : this.adminService.activate(staff.id);
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

  isEditingMode() {
    return !!this.editingUserId();
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

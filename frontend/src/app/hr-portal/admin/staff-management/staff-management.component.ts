import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import {
  AdminUserService,
  CreateStaffAccountDto,
  UpdateStaffAccountDto,
} from '../../../core/services/admin-user.service';
import { DepartmentService } from '../../../core/services/department.service';
import {
  Department,
  Employee,
  UserAccount,
  UserRole,
} from '../../../core/models';

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
  filterDepartment = signal<number | ''>('');
  searchQuery = signal('');

  showCreateDialog = signal(false);
  showEditDialog = signal(false);
  creating = signal(false);
  updating = signal(false);
  formError = signal('');
  formSuccess = signal('');
  selectedStaff = signal<UserAccount | null>(null);
  formData: CreateStaffAccountDto = {
    email: '',
    fullName: '',
    role: UserRole.HR,
    departmentId: 0,
    position: '',
    phone: '',
  };
  editFormData: UpdateStaffAccountDto = {
    fullName: '',
    role: UserRole.HR,
    departmentId: 0,
    position: '',
    phone: '',
  };
  private readonly defaultEditFormData: UpdateStaffAccountDto = {
    fullName: '',
    role: UserRole.HR,
    departmentId: 0,
    position: '',
    phone: '',
  };

  constructor(
    private authService: AuthService,
    private adminService: AdminUserService,
    private departmentService: DepartmentService,
  ) {}

  get isSuperadminView(): boolean {
    return this.authService.isSuperadmin();
  }

  get pageTitle(): string {
    return this.isSuperadminView ? 'Employee Accounts' : 'Interviewer Accounts';
  }

  ngOnInit() {
    if (!this.isSuperadminView) {
      this.filterRole.set(UserRole.INTERVIEWER);
      this.formData.role = UserRole.INTERVIEWER;
    }
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
        role: this.isSuperadminView
          ? this.filterRole() || undefined
          : UserRole.INTERVIEWER,
        departmentId: this.filterDepartment() || undefined,
        search: this.searchQuery().trim() || undefined,
        page: this.currentPage(),
        limit: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          const rawItems = (res.data as any)?.items ?? [];
          const items = rawItems.map((item: any) => this.toStaffRow(item));
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
          this.errorMsg.set('Unable to load staff accounts. Please try again.');
          this.loading.set(false);
        },
      });
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadUsers();
  }

  clearFilters() {
    this.filterRole.set(this.isSuperadminView ? '' : UserRole.INTERVIEWER);
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
      role: this.isSuperadminView ? UserRole.HR : UserRole.INTERVIEWER,
      departmentId: 0,
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
    if (!this.formData.departmentId || Number(this.formData.departmentId) <= 0) {
      this.formError.set('Department is required.');
      return;
    }

    const dto: CreateStaffAccountDto = {
      ...this.formData,
      email,
      fullName,
      role: this.isSuperadminView ? this.formData.role : UserRole.INTERVIEWER,
      departmentId: Number(this.formData.departmentId),
      position: this.formData.position?.trim() || undefined,
      phone: this.formData.phone?.trim() || undefined,
    };

    this.creating.set(true);
    this.formError.set('');
    this.adminService.createStaff(dto).subscribe({
      next: () => {
        this.creating.set(false);
        this.closeCreateDialog();
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
    this.errorMsg.set('');
    this.formSuccess.set('');
    this.adminService.resendTemporaryPassword(user.id).subscribe({
      next: () =>
        this.formSuccess.set(
          `Invitation email re-sent to ${user.email}. ` +
            `Please verify the email, then set a new password to activate the account.`,
        ),
      error: (err) =>
        this.errorMsg.set(
          err?.error?.message ??
            'Unable to resend credentials. Please try again.',
        ),
    });
  }

  openEditDialog(employee: Employee) {
    const user = employee.user;
    if (!user || user.role === UserRole.SUPER_ADMIN) return;
    const resolvedDepartmentId = Number(
      employee.department?.id ??
        employee.departmentId ??
        (employee as any)?.department?.id ??
        0,
    );
    this.selectedStaff.set(user);
    this.editFormData = {
      fullName: user.fullName ?? '',
      role: (user.role as StaffRole) ?? UserRole.HR,
      departmentId: resolvedDepartmentId,
      position: employee.position ?? (employee as any)?.jobTitle ?? '',
      phone: user.phone ?? '',
    };
    this.formError.set('');
    this.showEditDialog.set(true);
  }

  closeEditDialog() {
    this.showEditDialog.set(false);
    this.selectedStaff.set(null);
    this.formError.set('');
    this.editFormData = { ...this.defaultEditFormData };
  }

  saveEditedStaff() {
    const staff = this.selectedStaff();
    if (!staff) return;
    const fullName = this.editFormData.fullName.trim();
    if (!fullName) {
      this.formError.set('Full name is required.');
      return;
    }
    if (!this.editFormData.departmentId || Number(this.editFormData.departmentId) <= 0) {
      this.formError.set('Department is required.');
      return;
    }

    this.updating.set(true);
    this.formError.set('');
    this.adminService
      .updateStaff(staff.id, {
        ...this.editFormData,
        fullName,
        departmentId: Number(this.editFormData.departmentId),
        position: this.editFormData.position?.trim() || undefined,
        phone: this.editFormData.phone?.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.updating.set(false);
          this.closeEditDialog();
          this.formSuccess.set('Staff account updated successfully.');
          const updated = this.toStaffRow(res.data as any);
          this.employees.update((rows) =>
            rows.map((row) =>
              String(row.user?.id ?? row.id) === String(staff.id) ? updated : row,
            ),
          );
          this.loadUsers();
        },
        error: (err) => {
          this.updating.set(false);
          this.formError.set(
            err?.error?.message ?? 'Unable to update staff account.',
          );
        },
      });
  }

  private toStaffRow(item: any): Employee {
    if (item?.user) {
      return {
        ...item,
        departmentId: Number(item.department?.id ?? item.departmentId ?? 0),
        position: item.position ?? item.jobTitle ?? '',
      } as Employee;
    }
    return {
      ...item.employee,
      user: item,
      department: item.employee?.department,
      departmentId: Number(item.employee?.department?.id ?? 0),
      position: item.employee?.jobTitle ?? '',
      createdAt: item.createdAt,
    } as Employee;
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
    if (role === 'Super Admin') return 'badge-danger';
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

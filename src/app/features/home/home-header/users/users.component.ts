import { Component, OnInit, inject, ViewChild } from '@angular/core';

import { RouterModule, Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

import { User } from '../../../../core/interfaces/user.interface';
import { UserService } from '../../../../core/services/user.service';
import { UserEditComponent } from './user-edit/user-edit.component';
import { UserDetailsModalComponent } from './user-details-modal/user-details-modal.component';
import { UserCreateComponent } from '../users/user-create/user-create.component';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginator,
    MatTooltipModule,
    NgxSpinnerModule
],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private spinner = inject(NgxSpinnerService);

  dataSource = new MatTableDataSource<User>();
  displayedColumns: string[] = [
    'name',
    'email',
    'status',
    'role',
    'phone',
    'location',
    'actions',
  ];
  currentUser: any;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    );
    this.dataSource.filterPredicate = this.createFilter();
    this.loadUsers();
    this.userService.getUsers().subscribe((users) => {
      this.dataSource.data = users;
      this.dataSource.paginator = this.paginator;
    });
  }

  /** Carrega os usuários */
  loadUsers(): void {
    this.spinner.show();

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.dataSource.data = users;
        this.dataSource.paginator = this.paginator;
        this.spinner.hide();
      },
      error: () => {
        this.snackBar.open('Erro ao carregar usuários', 'Close', {
          duration: 2000,
        });
        this.spinner.hide();
      },
    });
  }

  /** Aplica filtro na tabela */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /** Redireciona para tela de edição */
  onEdit(id: string): void {
    this.router.navigate(['/users/edit', id]);
  }

  /** Deleta usuário e recarrega lista */
  onDelete(id: string): void {
    const snackBarRef = this.snackBar.open(
      'Are you sure you want to delete this user? ',
      'Yes',
      {
        duration: 5000, // fecha automaticamente em 5s se não clicar
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.snackBar.open('✅ User deleted', 'Close', { duration: 2000 });
          this.loadUsers();
        },
        error: () =>
          this.snackBar.open('❌ Error deleting user', 'Close', {
            duration: 3000,
          }),
      });
    });
  }

  canEdit(user: any): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'Admin') return true;
    if (this.currentUser.role === 'Manager') {
      // Manager pode editar ele mesmo e outros, menos Admin
      return user.role !== 'Admin' || user.id === this.currentUser.id;
    }
    return false;
  }

  canDelete(user: any): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'Admin') return true;
    if (this.currentUser.role === 'Manager') {
      // Manager pode deletar ele mesmo e outros, menos Admin
      return user.role !== 'Admin' || user.id === this.currentUser.id;
    }
    return false;
  }

  createFilter(): (data: User, filter: string) => boolean {
    return (data: User, filter: string): boolean => {
      const search = filter.trim().toLowerCase();
      return (
        (data.name?.toLowerCase().includes(search) ?? false) ||
        (data.email?.toLowerCase().includes(search) ?? false) ||
        (data.status?.toLowerCase().includes(search) ?? false) ||
        (data.role?.toLowerCase().includes(search) ?? false) ||
        (data.phone?.toLowerCase().includes(search) ?? false) ||
        (data.location?.toLowerCase().includes(search) ?? false)
      );
    };
  }

  openUserDetails(user: User) {
    this.dialog.open(UserDetailsModalComponent, {
      data: { user },
      width: '600px',
    });
  }

  openEditUser(userId: string) {
    this.dialog
      .open(UserEditComponent, {
        width: '440px',
        data: { id: userId },
        disableClose: true,
        autoFocus: false,
      })
      .afterClosed()
      .subscribe(() => this.loadUsers());
  }

  openCreateUser() {
    this.dialog
      .open(UserCreateComponent, {
        width: '440px',
        disableClose: true,
        autoFocus: false,
      })
      .afterClosed()
      .subscribe(() => this.loadUsers());
  }
}

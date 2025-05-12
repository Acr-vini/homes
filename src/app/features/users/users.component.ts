import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { UserService, User } from '../../core/services/user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule, // Import para <mat-form-field>
    MatInputModule, // Import para <matInput>
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

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

  ngOnInit(): void {
    // Define que o filtro deve buscar apenas no campo "name"
    this.dataSource.filterPredicate = (data: User, filter: string) =>
      data.name.toLowerCase().includes(filter);
    this.loadUsers();
  }

  /** Carrega os usuários */
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => (this.dataSource.data = users),
      error: () =>
        this.snackBar.open('Erro ao carregar usuários', 'Close', {
          duration: 2000,
        }),
    });
  }

  /** Aplica filtro na tabela */
  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase(); // Remove espaços e deixa minúsculo
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
            duration: 2000,
          }),
      });
    });
  }
}

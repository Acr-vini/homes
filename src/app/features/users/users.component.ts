// src/app/features/users/users.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';

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
    this.loadUsers();
  }

  /** Carrega a lista de usuários via HTTP */
  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => (this.dataSource.data = users),
      error: (err) =>
        this.snackBar.open('Erro ao carregar usuários', 'Close', {
          duration: 2000,
        }),
    });
  }

  onEdit(id: string): void {
    this.router.navigate(['/users/edit', id]);
  }

  onDelete(id: string): void {
    this.userService.deleteUser(id).subscribe({
      next: () => {
        this.snackBar.open('User deleted', 'Close', { duration: 2000 });
        this.loadUsers(); // Recarrega a lista após exclusão
      },
      error: () =>
        this.snackBar.open('Error deleting user', 'Close', { duration: 2000 }),
    });
  }
}

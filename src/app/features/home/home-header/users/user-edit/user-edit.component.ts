import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../../../core/services/user.service';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject, Optional } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    RouterModule,
    FormsModule,
    CommonModule,
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatTooltipModule,
    NgxSpinnerModule,
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss',
})
export class UserEditComponent implements OnInit {
  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  userId!: string;
  user = {
    id: '',
    name: '',
    email: '',
    password: '',
    status: '',
    role: '',
    phone: '',
    location: '',
  };
  userForm!: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router,
    private fb: FormBuilder,
    private spinner: NgxSpinnerService,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef?: MatDialogRef<UserEditComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
  ) {}

  ngOnInit(): void {
    this.userId = this.data?.id || this.route.snapshot.paramMap.get('id')!;
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: [''],
      phone: [''],
      location: [''],
      role: [''],
      status: ['', Validators.required],
    });

    this.userService.getUserById(this.userId).subscribe((user) => {
      this.user = user;
      this.userForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        location: user.location,
        role: user.role,
        status: user.status,
      });
    });
  }

  onSave(): void {
    if (this.userForm.valid) {
      this.spinner.show();

      const updatedUser = { ...this.user, ...this.userForm.value };
      this.userService.updateUser(this.userId, updatedUser).subscribe({
        next: () => {
          this.spinner.hide();
          if (this.dialogRef) {
            this.dialogRef.close();
          } else {
            this.router.navigate(['/users']);
          }
        },
        error: () => {
          this.spinner.hide();
        },
      });
    }
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/users']);
    }
  }

  canEdit(user: any): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.role === 'Admin') return true;
    if (this.currentUser.role === 'Manager') {
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

  onEdit(id: string) {
    // Redireciona para a tela de edição do usuário
    this.router.navigate(['/users/edit', id]);
  }

  onDelete(id: string) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe(() => {
        if (this.dialogRef) {
          this.dialogRef.close();
        } else {
          this.router.navigate(['/users']);
        }
      });
    }
  }
}

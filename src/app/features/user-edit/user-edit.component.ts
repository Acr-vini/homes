import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { NgModule } from '@angular/core';
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
import { Observable, startWith, map } from 'rxjs';

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
  ],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss',
})
export class UserEditComponent implements OnInit {
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
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id')!;
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
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
      const updatedUser = { ...this.user, ...this.userForm.value };
      this.userService.updateUser(updatedUser).subscribe({
        next: () => this.router.navigate(['/users']),
        error: () => {
          // Exiba um erro se necessário
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}

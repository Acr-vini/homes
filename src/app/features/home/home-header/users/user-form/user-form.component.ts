import { Component, Inject, Optional, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../../../core/services/user.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { User } from '../../../../../core/interfaces/user.interface';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    NgxSpinnerModule,
    MatProgressBarModule,
    MatIcon,
  ],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  progress = 0;

  // Signals para controlar o modo
  isEditMode = signal(false);
  currentUserId = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar,
    private spinner: NgxSpinnerService,
    @Optional() public dialogRef?: MatDialogRef<UserFormComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: { id: string }
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', Validators.required],
      location: ['', Validators.required],
      role: ['User', Validators.required],
      status: ['active', Validators.required],
      cpf: [''],
    });
  }

  ngOnInit(): void {
    const userId = this.data?.id;
    if (userId) {
      this.isEditMode.set(true);
      this.currentUserId.set(userId);
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.loadUserData(userId);
    }

    this.userForm.get('role')?.valueChanges.subscribe((role) => {
      const cpfControl = this.userForm.get('cpf');
      if (role === 'Owner' || role === 'Real Estate Agency') {
        cpfControl?.setValidators(Validators.required);
      } else {
        cpfControl?.clearValidators();
      }
      cpfControl?.updateValueAndValidity();
    });

    this.userForm.valueChanges.subscribe(() => {
      this.calculateProgress();
    });
  }

  loadUserData(id: string): void {
    this.spinner.show();
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.userForm.patchValue(user);
        this.spinner.hide();
      },
      error: (err) => {
        console.error('Error loading user data:', err);
        this.snackBar.open('❌ Error loading user data.', 'Close', {
          duration: 3000,
        });
        this.spinner.hide();
        this.onCancel();
      },
    });
  }

  private calculateProgress(): void {
    const requiredControls = ['name', 'email', 'role', 'status'];
    if (!this.isEditMode()) {
      requiredControls.push('password');
    }
    const validControls = requiredControls.filter((controlName) => {
      const control = this.userForm.get(controlName);
      return control && control.valid;
    });
    const completedFields = validControls.length;
    const totalFields = requiredControls.length;
    this.progress = (completedFields / totalFields) * 100;
  }

  onSave(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.snackBar.open(
        '❌ Please fill all required fields correctly.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.spinner.show();
    const formValue = this.userForm.getRawValue();

    if (this.isEditMode()) {
      // Lógica de ATUALIZAÇÃO
      const updatedUser: Partial<User> = { ...formValue };
      delete updatedUser.password; // Não enviar senha vazia
      if (formValue.password) {
        updatedUser.password = formValue.password; // Enviar apenas se uma nova foi digitada
      }
      this.userService
        .updateUser(this.currentUserId()!, updatedUser)
        .subscribe({
          next: () => this.handleSuccess('updated'),
          error: (err) => this.handleError(err, 'updating'),
        });
    } else {
      // Lógica de CRIAÇÃO
      this.userService.createUser(formValue).subscribe({
        next: () => this.handleSuccess('created'),
        error: (err) => this.handleError(err, 'creating'),
      });
    }
  }

  private handleSuccess(action: 'created' | 'updated'): void {
    this.snackBar.open(`✅ User successfully ${action}!`, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
    this.spinner.hide();
    this.dialogRef?.close(true);
  }

  private handleError(err: any, action: 'creating' | 'updating'): void {
    console.error(`Error ${action} user:`, err);
    this.snackBar.open(`❌ Error ${action} user`, 'Close', {
      duration: 3000,
      panelClass: ['snackbar-error'],
    });
    this.spinner.hide();
  }

  onCancel(): void {
    this.dialogRef?.close();
  }
}

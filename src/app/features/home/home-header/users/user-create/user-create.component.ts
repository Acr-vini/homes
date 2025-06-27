import { Component, Inject, Optional, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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

@Component({
  selector: 'app-user-create',
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
    MatProgressBarModule
],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.scss',
})
export class UserCreateComponent implements OnInit {
  userForm: FormGroup;
  userId?: string;
  progress = 0;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private spinner: NgxSpinnerService,
    @Optional() public dialogRef?: MatDialogRef<UserCreateComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
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
    this.userId = this.data?.id || this.route.snapshot.paramMap.get('id')!;
    if (this.userId) {
      this.userService.getUserById(this.userId).subscribe((user) => {
        this.userForm.patchValue(user);
        this.userForm.get('password')?.disable();
      });
    }

    this.userForm.get('role')?.valueChanges.subscribe((role) => {
      const cpfControl = this.userForm.get('cpf');
      if (role === 'Realtor') {
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

  private calculateProgress(): void {
    // Define quais campos são obrigatórios para o progresso
    const requiredControls = ['name', 'email', 'password', 'role', 'status'];

    // Para edição, não contamos a senha (pois está desabilitada)
    if (this.userId) {
      const index = requiredControls.indexOf('password');
      if (index > -1) {
        requiredControls.splice(index, 1);
      }
    }

    const validControls = requiredControls.filter((controlName) => {
      const control = this.userForm.get(controlName);
      return control && control.valid;
    });

    const completedFields = validControls.length;
    const totalFields = requiredControls.length;

    // Calcula a porcentagem e atualiza a propriedade 'progress'
    this.progress = (completedFields / totalFields) * 100;
  }

  onSave(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      this.snackBar.open(
        '❌ Please fill all required fields correctly.',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    this.spinner.show();

    const formValue = this.userForm.getRawValue();

    // Constrói o payload manualmente para garantir a estrutura exata
    const userPayload: any = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      status: formValue.status,
      role: formValue.role,
      phone: formValue.phone,
      location: formValue.location,
    };

    // Adiciona o CPF apenas se a role for Realtor
    if (formValue.role === 'Realtor') {
      userPayload.cpf = formValue.cpf;
    }

    this.userService.createUser(userPayload).subscribe({
      next: () => {
        this.snackBar.open('✅ User successfully created!', 'Close', {
          panelClass: ['snackbar-success'],
        });
        this.spinner.hide();
        if (this.dialogRef) {
          this.dialogRef.close(true);
        } else {
          this.router.navigate(['/users']);
        }
      },
      error: (err) => {
        console.error('Error creating user:', err);
        this.snackBar.open('❌ Error creating user', 'Close', {
          panelClass: ['snackbar-error'],
        });
        this.spinner.hide();
      },
    });
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/users']);
    }
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../../core/services/user.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    NgxSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private spinner = inject(NgxSpinnerService);

  hidePassword = true;

  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['User', Validators.required],
    phone: ['', Validators.required],
    cpf: [''],
    location: ['', Validators.required],
  });

  ngOnInit(): void {
    this.registerForm.get('role')?.valueChanges.subscribe((role) => {
      const cpfControl = this.registerForm.get('cpf');

      if (role === 'Owner' || role === 'Real Estate Agency') {
        cpfControl?.setValidators(Validators.required);
      } else {
        cpfControl?.clearValidators();
      }
      cpfControl?.updateValueAndValidity();
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.snackBar.open(
        'Please fill all required fields correctly.',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    this.spinner.show();

    const formValue = this.registerForm.value;

    const newUserPayload: any = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      status: 'active',
      role: formValue.role,
      phone: formValue.phone,
      location: formValue.location,
    };

    if (formValue.role === 'Owner' || formValue.role === 'Real Estate Agency') {
      newUserPayload.cpf = formValue.cpf;
    }

    this.userService.createUser(newUserPayload).subscribe({
      next: () => {
        this.spinner.hide();
        this.snackBar.open(
          '✅ Account created successfully! Please log in.',
          'Close',
          {
            duration: 5000,
          }
        );
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.spinner.hide();
        this.snackBar.open('❌ Error creating account.', 'Close', {
          duration: 3000,
        });
        console.error(err);
      },
    });
  }
}

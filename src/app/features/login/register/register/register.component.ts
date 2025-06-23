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
    phone: ['', Validators.required], // Alterado para ser sempre obrigatório
    cpf: [''], // Permanece condicional
    location: ['', Validators.required], // Alterado para ser sempre obrigatório
  });

  ngOnInit(): void {
    // A lógica agora só precisa controlar o campo CPF
    this.registerForm.get('role')?.valueChanges.subscribe((role) => {
      const cpfControl = this.registerForm.get('cpf');

      if (role === 'Realtor') {
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

    // Constrói o payload manualmente para garantir a estrutura exata
    const newUserPayload: any = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      status: 'active', // Define o status padrão
      role: formValue.role,
      phone: formValue.phone,
      location: formValue.location,
    };

    // Adiciona o CPF apenas se a role for Realtor
    if (formValue.role === 'Realtor') {
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
        console.error('Registration failed:', err);
        this.snackBar.open(
          '❌ Failed to create account. The email might already be in use.',
          'Close',
          {
            duration: 5000,
          }
        );
      },
    });
  }
}

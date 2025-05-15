import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  hidePassword = true;

  onSubmit(): void {
    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/home']);
        } else {
          this.snackBar.open('Invalid credentials', 'Close', {
            duration: 3000,
          });
        }
      },
      error: (err) => {
        if (err.message === 'disabled') {
          this.snackBar.open(
            'Your user is disabled. Please contact support.',
            'Close',
            { duration: 5000 }
          );
        } else {
          this.snackBar.open('Error trying to login', 'Close', {
            duration: 3000,
          });
        }
      },
    });
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    const email = this.loginForm.get('email')?.value;
    if (!email || this.loginForm.get('email')?.invalid) {
      this.snackBar.open(
        'Please enter a valid email to reset your password.',
        'Close',
        {
          duration: 4000,
        }
      );
      return;
    }
    // Mock envio de e-mail
    this.snackBar.open(
      `A password reset link was sent to ${email} (mocked).`,
      'Close',
      { duration: 4000 }
    );
  }
}

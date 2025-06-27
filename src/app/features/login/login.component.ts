import { Component, inject, signal } from '@angular/core';

import { Router, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    NgxSpinnerModule,
    MatIconButton,
    RouterLink,
    MatCardModule
],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private spinner = inject(NgxSpinnerService);

  // define the reactive form
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  hidePassword = true;

  /** called on form submit */
  onSubmit(): void {
    this.spinner.show();
    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (success) => {
        console.log('Component login success flag:', success);
        if (success) {
          this.spinner.hide();
          this.router.navigate(['/home']);
        }
      },
      error: (err: Error) => {
        this.spinner.hide();
        console.error('Component login error:', err);

        if (err.message === 'disabled') {
          this.snackBar.open(
            'User disabled. Please contact the IT team.',
            'Close',
            { duration: 5000 }
          );
        } else {
          this.snackBar.open(err.message, 'Close', {
            duration: 4000,
          });
        }
      },
    });
  }

  /** called when Forgot Password link is clicked */
  onForgotPassword(event: Event): void {
    event.preventDefault();
    const email = this.loginForm.get('email')?.value;
    if (!email || this.loginForm.get('email')?.invalid) {
      this.snackBar.open(
        'Please enter a valid email to reset your password.',
        'Close',
        { duration: 4000 }
      );
      return;
    }
    this.snackBar.open(
      `A password reset link was sent to ${email} (mocked).`,
      'Close',
      { duration: 4000 }
    );
  }
}

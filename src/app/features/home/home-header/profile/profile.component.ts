import { Component, inject } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatIconModule
],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  private fb = inject(FormBuilder);
  user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  showRoleForm = false;

  roleForm: FormGroup;
  passwordForm: FormGroup;

  constructor() {
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required]],
    });

    this.roleForm = this.fb.group({
      name: [{ value: this.user?.name, disabled: true }, Validators.required],
      email: [
        { value: this.user?.email, disabled: true },
        [Validators.required, Validators.email],
      ],
      role: ['Owner', Validators.required],
      cpf: ['', Validators.required],
      location: [
        { value: this.user?.location, disabled: true },
        Validators.required,
      ],
    });
  }

  onRoleSubmit(): void {
    if (this.roleForm.valid) {
      console.log('Updating role:', this.roleForm.getRawValue());
      // Lógica para submeter a mudança de role
    }
  }

  resetPassword(): void {
    if (this.passwordForm.valid) {
      console.log('Resetting password');
      // Lógica para resetar a senha
    }
  }
}

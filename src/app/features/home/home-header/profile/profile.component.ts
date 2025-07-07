import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // 1. Importe o CommonModule
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
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MyListingsComponent } from './my-listings/my-listings.component';
import { UserService } from '../../../../core/services/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDividerModule,
    MatIconModule,
    MatButtonToggleModule,
    MyListingsComponent,
    MatSnackBarModule,
    MatTabsModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);

  user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  showRoleForm = false;
  isListingsViewActive = false;
  selectedTabIndex = 0;

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

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'listings') {
        this.selectedTabIndex = 1; // Assumindo que 'My Listings' é a segunda aba (índice 1)
      }
    });
  }

  get canHaveListings(): boolean {
    if (!this.user) return false;
    const allowedRoles = ['Owner', 'Real Estate Agency', 'Manager', 'Admin'];
    return allowedRoles.includes(this.user.role);
  }

  onRoleSubmit(): void {
    if (!this.roleForm.valid) return;
    const updatedUserData = this.roleForm.getRawValue();

    this.userService.updateUser(this.user.id, updatedUserData).subscribe({
      next: (updatedUser) => {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.user = updatedUser;
        this.showRoleForm = false;
        this.snackBar.open('✅ Role updated successfully!', 'Close', {
          duration: 3000,
        });
      },
      error: () =>
        this.snackBar.open('❌ Error updating role.', 'Close', {
          duration: 3000,
        }),
    });
  }

  resetPassword(): void {
    if (!this.passwordForm.valid) return;
    const { password, confirm } = this.passwordForm.value;

    if (password !== confirm) {
      this.snackBar.open('❌ Passwords do not match.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.userService.updateUser(this.user.id, { password }).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.snackBar.open('✅ Password reset successfully!', 'Close', {
          duration: 3000,
        });
      },
      error: () =>
        this.snackBar.open('❌ Error resetting password.', 'Close', {
          duration: 3000,
        }),
    });
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.isListingsViewActive = event.index === 1;
  }
}

// user-create.component.ts

import { Component, Inject, Optional, OnInit } from '@angular/core'; // ALTERADO: Adicionado OnInit
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from '../../../../../core/services/user.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
// NOVO: Importe o MatProgressBarModule
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-user-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    NgxSpinnerModule,
    // NOVO: Adicione o MatProgressBarModule aos imports
    MatProgressBarModule,
  ],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.scss',
})
// ALTERADO: Implemente a interface OnInit
export class UserCreateComponent implements OnInit {
  userForm: FormGroup;
  userId?: string;
  // NOVO: Adicione a propriedade para controlar o progresso
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
      password: ['', Validators.required],
      phone: [''],
      location: [''],
      role: ['', Validators.required],
      status: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.userId = this.data?.id || this.route.snapshot.paramMap.get('id')!;
    if (this.userId) {
      this.userService.getUserById(this.userId).subscribe((user) => {
        this.userForm.patchValue(user);
        // Desabilitamos o campo de senha na edição para evitar que seja alterada acidentalmente
        this.userForm.get('password')?.disable();
      });
    }

    // NOVO: Inscreva-se nas mudanças do formulário para calcular o progresso
    this.userForm.valueChanges.subscribe(() => {
      this.calculateProgress();
    });
  }

  // NOVO: Método para calcular o progresso do formulário
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
    // ALTERADO: Melhoria na validação para fornecer feedback ao usuário
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

    this.userService.createUser(this.userForm.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('✅ User successfully created!', 'Close', {
          panelClass: ['snackbar-success'],
        });
        this.spinner.hide();
        if (this.dialogRef) {
          this.dialogRef.close(true); // Indica sucesso ao fechar
        } else {
          this.router.navigate(['/users']);
        }
      },
      error: () => {
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

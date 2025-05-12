import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
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
  ],
  templateUrl: './user-create.component.html',
  styleUrl: './user-create.component.scss',
})
export class UserCreateComponent {
  userForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // ✅ Criação do formulário com validações
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required], // ✅ Novo campo obrigatório
      phone: [''],
      location: [''],
      role: ['', Validators.required],
      status: ['', Validators.required],
    });
  }

  onSave(): void {
    if (this.userForm.valid) {
      this.userService.createUser(this.userForm.value).subscribe({
        next: () => {
          // ✅ Mensagem de sucesso centralizada no topo (posição já configurada no app.config.ts)
          this.snackBar.open('✅ User successfully created!', 'Close', {
            panelClass: ['snackbar-success'], // opcional: classe para customizar estilo
          });

          // ✅ Redireciona para a listagem após salvar
          this.router.navigate(['/users']);
        },
        error: () => {
          // ✅ Mensagem de erro
          this.snackBar.open('❌ Error creating user', 'Close', {
            panelClass: ['snackbar-error'], // opcional: estilo diferenciado para erros
          });
        },
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}

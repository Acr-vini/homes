import { Component, Inject, Optional } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
  userId?: string;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    @Optional() public dialogRef?: MatDialogRef<UserCreateComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
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

  ngOnInit(): void {
    this.userId = this.data?.id || this.route.snapshot.paramMap.get('id')!;
    if (this.userId) {
      this.userService.getUserById(this.userId).subscribe((user) => {
        this.userForm.patchValue({
          name: user.name,
          email: user.email,
          password: user.password, // ✅ Novo campo obrigatório
          phone: user.phone,
          location: user.location,
          role: user.role,
          status: user.status,
        });
      });
    }
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
          if (this.dialogRef) {
            this.dialogRef.close();
          } else {
            this.router.navigate(['/users']);
          }
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
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/users']);
    }
  }
}

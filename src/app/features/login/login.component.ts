import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Adicione esta importação
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
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router); // Injete o Router para navegação

  // Criação do formulário reativo
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  // Controla a visibilidade da senha
  hidePassword: boolean = true;

  // Método de envio do formulário
  onSubmit(): void {
    if (this.loginForm.valid) {
      console.log('Formulário enviado:', this.loginForm.value);

      this.router.navigate(['/home']); // Redireciona para a página 'home'
    } else {
      console.log('Formulário inválido');
      // Exiba uma mensagem de erro ou destaque os campos inválidos
    }
  }
}

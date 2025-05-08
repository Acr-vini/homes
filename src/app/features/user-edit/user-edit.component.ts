import { Component, OnInit } from '@angular/core';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../core/services/user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss',
})
export class UserEditComponent implements OnInit {
  userId!: string;
  user = {
    id: '',
    name: '',
    email: '',
    password: '',
    status: '',
    role: '',
    phone: '',
    location: '',
  };

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id')!;
    this.userService.getUserById(this.userId).subscribe((user) => {
      this.user = user; // Pega o usuário pelo id
    });
  }

  onSave(): void {
    this.userService.updateUser(this.user); // Atualiza o usuário
    this.router.navigate(['/users']); // Redireciona para a lista de usuários
  }
}

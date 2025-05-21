import { Routes } from '@angular/router';

// Página pública de login
import { LoginComponent } from '../features/login/login.component';

// Container com toolbar/menu para páginas autenticadas
import { ShellComponent } from '../features/shell/shell.component';

// Páginas protegidas
import { HomeComponent } from '../features/home/home.component';
import { DetailsComponent } from '../features/details/details.component';
import { CreateComponent } from '../features/create/create.component';
import { EditComponent } from '../features/edit/edit.component';
import { AboutComponent } from '../features/about/about.component';
import { ContactComponent } from '../features/contact/contact.component';
import { UsersComponent } from '../features/users/users.component';
import { UserCreateComponent } from '../features/user-create/user-create.component';
import { UserEditComponent } from '../features/user-edit/user-edit.component';

import { AuthGuard } from '../core/guards/auth.guard';

const routes: Routes = [
  // Rota pública
  { path: 'login', component: LoginComponent },

  // Container principal (Shell) para todas as rotas autenticadas
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      // Redireciona raiz para /home
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // Dashboard / Home
      { path: 'home', component: HomeComponent, title: 'Home page' },

      // CRUD de Houses
      {
        path: 'details/:id',
        component: DetailsComponent,
        title: 'Home details',
      },

      // Sobre e Contato
      { path: 'about', component: AboutComponent, title: 'About' },
      { path: 'contact', component: ContactComponent, title: 'Contact' },

      // CRUD de Usuários
      { path: 'users', component: UsersComponent, title: 'Users' },

      {
        path: 'users/edit/:id',
        component: UserEditComponent,
        title: 'Edit User',
      },

      {
        path: 'favorites',
        loadComponent: () =>
          import('../features/favorites/favorites.component').then(
            (m) => m.FavoritesComponent
          ),
      },
    ],
  },

  // Qualquer rota não cadastrada redireciona para login
  { path: '**', redirectTo: 'login' },
];

export default routes;

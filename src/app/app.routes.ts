import { Routes } from '@angular/router';

// Página pública de login
import { LoginComponent } from './features/login/login.component';

// Container com toolbar/menu para páginas autenticadas
import { homeheaderComponent } from './features/home/home-header/home-header-page/home-header.component';

// Páginas protegidas
import { AuthGuard } from './core/guards/auth.guard';

import { RegisterComponent } from './features/login/register/register/register.component'; // ADICIONE ESTA IMPORTAÇÃO

const routes: Routes = [
  // Rota pública
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, // ADICIONE ESTA ROTA

  // Container principal (Shell) para todas as rotas autenticadas
  {
    path: '',
    component: homeheaderComponent,
    canActivate: [AuthGuard],
    children: [
      // Redireciona raiz para /home
      { path: '', redirectTo: 'home', pathMatch: 'full' },

      // Dashboard / Home
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/SCF/SCF-page/SCF.component').then(
            (m) => m.SCFComponent
          ),
        title: 'Home',
      },

      // CRUD de Houses
      {
        path: 'details/:id',
        loadComponent: () =>
          import(
            './features/home/house-list/house-cards/details/details.component'
          ).then((m) => m.DetailsComponent),
        title: 'Details',
      },

      // profile | users | about | contact | activity-date
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/home/home-header/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
        title: 'Profile',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/home/home-header/users/users.component').then(
            (m) => m.UsersComponent
          ),
        title: 'Users',
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/home/home-header/about/about.component').then(
            (m) => m.AboutComponent
          ),
        title: 'About',
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/home/home-header/contact/contact.component').then(
            (m) => m.ContactComponent
          ),
        title: 'Contact',
      },
      {
        path: 'activity-date',
        loadComponent: () =>
          import(
            './features/home/home-header/activity-date/activity-date.component'
          ).then((m) => m.ActivityDateComponent),
        title: 'Activity Date',
      },
      {
        path: 'users/edit/:id',
        loadComponent: () =>
          import(
            './features/home/home-header/users/user-edit/user-edit.component'
          ).then((m) => m.UserEditComponent),
        title: 'Edit User',
      },
      {
        path: 'favorites',
        loadComponent: () =>
          import('./features/home/SCF/favorites/favorites.component').then(
            (m) => m.FavoritesComponent
          ),
        title: 'Favorites',
      },
      {
        path: 'compare',
        loadComponent: () =>
          import(
            './features/home/SCF/compare/compare-page/compare.component'
          ).then((m) => m.CompareComponent),
        title: 'Compare',
      },
    ],
  },

  // Qualquer rota não cadastrada redireciona para login
  { path: '**', redirectTo: 'login' },
];

export default routes;

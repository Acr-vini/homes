import { Routes } from '@angular/router';

// Página pública de login
import { LoginComponent } from './features/login/login.component';

// Container com toolbar/menu para páginas autenticadas
import { homeheaderComponent } from './features/home/home-header/home-header-page/home-header.component';

// Páginas protegidas
import { SCFComponent } from './features/home/SCF/SCF-page/SCF.component';
import { DetailsComponent } from './features/home/house-list/house-cards/details/details.component';
import { CreateComponent } from './features/home/SCF/create/create.component';
import { EditComponent } from './features/home/house-list/house-cards/edit/edit.component';
import { AboutComponent } from './features/home/home-header/about/about.component';
import { ContactComponent } from './features/home/home-header/contact/contact.component';
import { UsersComponent } from './features/home/home-header/users/users.component';
import { UserCreateComponent } from './features/home/home-header/users/user-create/user-create.component';
import { UserEditComponent } from './features/home/home-header/users/user-edit/user-edit.component';
import { DetailsApplicationComponent } from './features/home/house-list/house-cards/details/details-application/details-application.component';
import { ActivityDateComponent } from './features/home/home-header/activity-date/activity-date.component';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  // Rota pública
  { path: 'login', component: LoginComponent },

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
        component: SCFComponent,
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

      // users | about | contact | activity-date
      {
        path: 'users',
        loadComponent: () =>
          import('./features/home/home-header/users/users.component').then(
            (m) => m.UsersComponent
          ),
        title: 'Users',
      },
      { path: 'about', component: AboutComponent, title: 'About' },
      { path: 'contact', component: ContactComponent, title: 'Contact' },
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
        path: 'details-application',
        loadComponent: () =>
          import(
            './features/home/house-list/house-cards/details/details-application/details-application.component'
          ).then((m) => m.DetailsApplicationComponent),
        title: 'Application Details',
      },
    ],
  },

  // Qualquer rota não cadastrada redireciona para login
  { path: '**', redirectTo: 'login' },
];

export default routes;

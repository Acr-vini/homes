import { CreateComponent } from '../features/create/create.component';
import { Routes } from '@angular/router';
import { HomeComponent } from '../features/home/home.component';
import { DetailsComponent } from '../features/details/details.component';
import { createComponent } from '@angular/core';
import { EditComponent } from '../features/edit/edit.component';
import { AboutComponent } from '../features/about/about.component';
import { ContactComponent } from '../features/contact/contact.component';
import { LoginComponent } from '../features/login/login.component';
import { UsersComponent } from '../features/users/users.component';
import { UserEditComponent } from '../features/user-edit/user-edit.component';

const routeConfig: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('../features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'home',
    component: HomeComponent,
    title: 'Home page',
  },
  {
    path: 'details/:id',
    component: DetailsComponent,
    title: 'Home details',
  },
  {
    path: 'create',
    component: CreateComponent,
    title: 'create',
  },
  {
    path: 'edit/:id',
    component: EditComponent,
    title: 'edit',
  },
  {
    path: 'about',
    component: AboutComponent,
    title: 'about',
  },
  {
    path: 'contact',
    component: ContactComponent,
    title: 'contact',
  },
  {
    path: 'users',
    component: UsersComponent,
  },
  {
    path: 'users/edit/:id',
    component: UserEditComponent,
  },
  {
    path: 'users/create',
    loadComponent: () =>
      import('../features/user-create/user-create.component').then(
        (m) => m.UserCreateComponent
      ),
  },
];

export default routeConfig;

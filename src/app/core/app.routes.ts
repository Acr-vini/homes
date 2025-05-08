import { CreateComponent } from './create/create.component';
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DetailsComponent } from './details/details.component';
import { createComponent } from '@angular/core';
import { EditComponent } from './edit/edit.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { LoginComponent } from './components/login.component'; // ajuste o caminho conforme sua estrutura

const routeConfig: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full', // Redireciona para login
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login.component').then((m) => m.LoginComponent),
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
];

export default routeConfig;

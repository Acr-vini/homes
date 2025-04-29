import { CreateComponent } from './create/create.component';
import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DetailsComponent } from './details/details.component';
import { createComponent } from '@angular/core';


const routeConfig: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Home page'
  },
  {
    path: 'details/:id',
    component: DetailsComponent,
    title: 'Home details'
  },
  {
    path: 'create',
    component: CreateComponent,
    title: 'create'
  }
];

export default routeConfig;



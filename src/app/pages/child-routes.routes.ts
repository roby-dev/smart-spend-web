import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NotFoundPageComponent } from '../not-found-page/not-found-page.component';
import { ListDetailComponent } from './list-detail/list-detail.component';

export const childRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, title: 'Mis listas' },
  { path: 'list/:id', component: ListDetailComponent, title: 'Detalles de la lista' }
];

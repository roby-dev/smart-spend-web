import { Routes } from '@angular/router';
import { pagesRoutes } from './pages/pages.routes';
import { NotFoundPageComponent } from './not-found-page/not-found-page.component';

export const routes: Routes = [
  pagesRoutes,
  {
    path: '',
    redirectTo: 'main',
    pathMatch: 'full'
  },
  {
    path: '**',
    component: NotFoundPageComponent
  }
];

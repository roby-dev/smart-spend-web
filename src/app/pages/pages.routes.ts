import { Route } from '@angular/router';
import { PagesComponent } from './pages.component';

export const pagesRoutes: Route = {
  path: 'main',
  component: PagesComponent,
  loadChildren: () =>
    import('./child-routes.routes').then(m => m.childRoutes)
};

import { Routes } from '@angular/router';
import { JsonFormatterComponent } from './json-formatter/json-formatter.component';
import { SqlFormatterComponent } from './sql-formatter/sql-formatter.component';
import { UndefineComponent } from './undefine/undefine.component';

export const routes: Routes = [
  { path: '', redirectTo: 'jsonFormtter', pathMatch: 'full' },
  {
    path: 'jsonFormtter',
    component: JsonFormatterComponent,
  },
  {
    path: 'sqlFormtter',
    loadComponent: () =>
      import('./sql-formatter/sql-formatter.component').then(
        (m) => m.SqlFormatterComponent
      ),
  },
  {
    path: '**', component: UndefineComponent
  }
];

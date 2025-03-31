import { Routes } from '@angular/router';



export const routes: Routes = [
  { path: '', redirectTo: 'jsonFormtter', pathMatch: 'full' },

  {
    path: 'jsonFormtter',
    loadComponent: () => import('./Components/json-formatter/json-formatter.component').then((m) => m.JsonFormatterComponent)
  },
  {
    path: 'sqlFormtter',
    loadComponent: () => import('./Components/sql-formatter/sql-formatter.component').then((m) => m.SqlFormatterComponent),
  },
  {
    path: 'login', loadComponent: () => import('./Components/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'JSON', loadComponent: () => import('./Components/json/json.component').then((m) => m.JSONComponent)
  },
  {
    path: '**', loadComponent: () => import('./Components/undefine/undefine.component').then((m) => m.UndefineComponent)
  }
];

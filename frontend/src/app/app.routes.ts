import { Routes } from '@angular/router';
import { Userapp } from './features/userapp/userapp';
import { Login } from './features/login/login';
import { Owner } from './features/owner/owner';
import { Admin } from './features/admin/admin';
import { roleGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: Userapp },
  { path: 'login', component: Login },
  { path: 'owner', component: Owner, canActivate: [roleGuard('owner')] },
  { path: 'admin', component: Admin, canActivate: [roleGuard('admin')] },
  { path: 'userapp', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
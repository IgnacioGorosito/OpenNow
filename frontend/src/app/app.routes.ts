import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Userapp } from './features/userapp/userapp';
import { Admin } from './features/admin/admin';
import { Owner } from './features/owner/owner';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'userapp', component: Userapp },
  { path: 'owner', component: Owner },
  { path: 'admin', component: Admin },
  { path: '**', redirectTo: '' }
];
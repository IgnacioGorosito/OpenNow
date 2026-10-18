import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService, Role } from './core/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  auth = inject(AuthService);
  private router = inject(Router);

  roleLabel(role: Role): string {
    if (role === 'admin') return 'Administrador';
    if (role === 'owner') return 'Dueño';
    return 'Usuario';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
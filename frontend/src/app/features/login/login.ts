import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService, Role } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  mode = signal<'login' | 'register'>('login');
  error = signal('');
  loading = signal(false);

  name = '';
  email = '';
  password = '';
  role: 'user' | 'owner' = 'user';

  constructor() {
    this.route.queryParamMap.subscribe((p) =>
      this.mode.set(p.get('modo') === 'registro' ? 'register' : 'login')
    );
  }

  setMode(m: 'login' | 'register'): void {
    this.mode.set(m);
    this.error.set('');
  }

  submit(): void {
    this.error.set('');
    const registering = this.mode() === 'register';
    if (!this.email.trim() || !this.password || (registering && !this.name.trim())) {
      this.error.set('Completá todos los campos');
      return;
    }
    this.loading.set(true);
    const request = registering
      ? this.auth.register({ name: this.name.trim(), email: this.email.trim(), password: this.password, role: this.role })
      : this.auth.login(this.email.trim(), this.password);

    request.subscribe({
      next: (r) => {
        this.loading.set(false);
        this.router.navigateByUrl(this.destino(r.user.role));
      },
      error: (e: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(e?.error?.error ?? 'No se pudo conectar con la API');
      }
    });
  }

  private destino(role: Role): string {
    if (role === 'admin') return '/admin';
    if (role === 'owner') return '/owner';
    return '/';
  }
}
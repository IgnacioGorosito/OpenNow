import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from './api.config';

export type Role = 'user' | 'owner' | 'admin';

export interface AuthUser {
  id: number;
  name: string;
  email?: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

const STORAGE_KEY = 'opennow_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private _user = signal<AuthUser | null>(null);
  private _token = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  constructor() {
    this.restore();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/login`, { email, password })
      .pipe(tap((r) => this.save(r)));
  }

  register(body: { name: string; email: string; password: string; role: 'user' | 'owner' }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${API_URL}/auth/register`, body)
      .pipe(tap((r) => this.save(r)));
  }

  logout(): void {
    this._user.set(null);
    this._token.set(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* sin storage disponible */
    }
  }

  hasRole(...roles: Role[]): boolean {
    const u = this._user();
    return !!u && roles.includes(u.role);
  }

  private save(r: AuthResponse): void {
    this._user.set(r.user);
    this._token.set(r.token);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
    } catch {
      /* sin storage disponible */
    }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as AuthResponse;
      if (saved?.token && saved?.user) {
        this._token.set(saved.token);
        this._user.set(saved.user);
      }
    } catch {
      /* sesión ilegible: se ignora */
    }
  }
}
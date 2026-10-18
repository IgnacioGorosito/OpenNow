import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService, Role } from './auth.service';

// Uso: canActivate: [roleGuard('admin')]
export function roleGuard(...roles: Role[]): CanActivateFn {
  return (): boolean | UrlTree => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (auth.hasRole(...roles)) return true;
    // sin sesión -> login; con sesión pero rol incorrecto -> inicio
    return router.createUrlTree([auth.isLoggedIn() ? '/' : '/login']);
  };
}
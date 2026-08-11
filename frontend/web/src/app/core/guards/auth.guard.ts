import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};

export const roleGuard = (...roles: ('client' | 'vendeur' | 'manager')[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/auth/login']);
    }

    if (auth.hasRole(...roles)) {
      return true;
    }

    const userRole = auth.role();
    if (userRole === 'vendeur') return router.createUrlTree(['/seller/scanner']);
    if (userRole === 'manager') return router.createUrlTree(['/manager/dashboard']);
    return router.createUrlTree(['/client/feed']);
  };
};

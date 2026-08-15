import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService, DEMO_TOKEN } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken;

  if (
    token &&
    token !== DEMO_TOKEN &&
    !req.url.includes('/auth/login') &&
    !req.url.includes('/sellers/sellers/login')
  ) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};

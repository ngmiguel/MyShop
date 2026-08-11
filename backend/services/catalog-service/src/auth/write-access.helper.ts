import { ForbiddenException } from '@nestjs/common';
import { AuthUser } from '../auth/jwt.strategy';

export function assertWriteAccess(user: AuthUser | undefined, storeId?: string): void {
  if (!user) {
    return;
  }
  if (user.role === 'manager') {
    return;
  }
  if (user.role === 'vendeur') {
    if (storeId && user.storeId && user.storeId !== storeId) {
      throw new ForbiddenException('You can only manage products for your own store');
    }
    return;
  }
  throw new ForbiddenException('Insufficient permissions for this operation');
}

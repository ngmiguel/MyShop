import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthUser } from './auth.types';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(err: Error | null, user: TUser): TUser | null {
    if (err) {
      return null;
    }
    return user ?? null;
  }
}

@Injectable()
export class ManagerAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = AuthUser>(
    err: Error | null,
    user: TUser,
    _info: unknown,
    _context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    const authUser = user as AuthUser;
    if (authUser.role !== 'manager') {
      throw new ForbiddenException('Manager role required');
    }
    return user;
  }
}

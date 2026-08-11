import { Injectable, BadGatewayException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthResponse } from '../interfaces';

interface RegisterPayload {
  email: string;
  password: string;
  role: 'vendeur';
  firstName: string;
  lastName: string;
  phone?: string;
  storeId: string;
}

@Injectable()
export class AuthClient {
  private readonly baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await fetch(`${this.baseUrl}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      throw new ConflictException('Email déjà utilisé');
    }
    if (!res.ok) {
      throw new BadGatewayException('Erreur lors de la création du compte auth');
    }
    return res.json() as Promise<AuthResponse>;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${this.baseUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.status === 401) {
      throw new UnauthorizedException('Identifiants invalides');
    }
    if (!res.ok) {
      throw new BadGatewayException('Erreur lors de la connexion auth');
    }
    return res.json() as Promise<AuthResponse>;
  }
}

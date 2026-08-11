export interface JwtPayload {
  sub: string;
  email: string;
  role: 'client' | 'vendeur' | 'manager';
  storeId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  storeId?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface StoreValidationResult {
  valid: boolean;
  storeId: string;
  storeName?: string;
  autoApproveSellers: boolean;
  maxSellers: number;
  currentSellerCount?: number;
}

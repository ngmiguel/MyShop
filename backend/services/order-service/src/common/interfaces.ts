export interface CartItem {
  productId: string;
  storeId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface QrPayload {
  reference: string;
  storeId: string;
  total: number;
  items: CartItem[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  storeId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  storeId?: string;
}

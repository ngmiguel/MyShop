export type UserRole = 'client' | 'vendeur' | 'manager';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  storeId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  categoryId?: string;
  subcategoryId?: string;
  storeId: string;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  currency: string;
  stock: number;
  imageUrl?: string;
  gallery?: string[];
  tags?: string[];
  isActive: boolean;
  storeName?: string;
}

export interface Category {
  id: string;
  name: string;
  slug?: string;
  icon?: string;
}

export interface Store {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
  coverUrl?: string;
  accessCode?: string;
  isActive: boolean;
  sellerCount?: number;
  productCount?: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
  unitPrice?: number;
  lineTotal?: number;
}

export interface Cart {
  id: string;
  sessionId?: string;
  userId?: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string;
}

export type OrderStatus = 'pending' | 'ready' | 'redeemed' | 'cancelled' | 'rated';

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  storeName?: string;
  userId?: string;
  sessionId?: string;
  status: OrderStatus;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  pickupCode: string;
  createdAt: string;
  redeemedAt?: string;
  sellerId?: string;
}

export interface Seller {
  id: string;
  userId?: string;
  storeId: string;
  storeName?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'pending' | 'active' | 'suspended';
  rating?: number;
  reviewCount?: number;
}

export interface SellerPerformance {
  sellerId: string;
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  averagePickupMinutes: number;
  ordersToday: number;
  revenueToday: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

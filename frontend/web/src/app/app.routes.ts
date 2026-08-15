import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'client/feed', pathMatch: 'full' },

  {
    path: 'auth',
    children: [
      { path: 'login', loadComponent: () => import('./features/auth/login-chooser/login-chooser.component').then(m => m.LoginChooserComponent) },
      { path: 'seller', loadComponent: () => import('./features/auth/seller-login/seller-login.component').then(m => m.SellerLoginComponent) },
      { path: 'seller/signup', loadComponent: () => import('./features/auth/seller-signup/seller-signup.component').then(m => m.SellerSignupComponent) },
      { path: 'manager', loadComponent: () => import('./features/auth/manager-login/manager-login.component').then(m => m.ManagerLoginComponent) },
    ],
  },

  {
    path: 'client',
    loadComponent: () => import('./features/client/client-layout.component').then(m => m.ClientLayoutComponent),
    children: [
      { path: 'feed', loadComponent: () => import('./features/client/feed/feed.component').then(m => m.FeedComponent) },
      { path: 'product/:id', loadComponent: () => import('./features/client/product/product-detail.component').then(m => m.ProductDetailComponent) },
      { path: 'store/:id', loadComponent: () => import('./features/client/store/store-detail.component').then(m => m.StoreDetailComponent) },
      { path: 'cart', loadComponent: () => import('./features/client/cart/cart.component').then(m => m.CartComponent) },
      { path: 'checkout', loadComponent: () => import('./features/client/checkout/checkout.component').then(m => m.CheckoutComponent) },
      { path: 'codes', loadComponent: () => import('./features/client/codes/codes.component').then(m => m.CodesComponent) },
      { path: 'favorites', loadComponent: () => import('./features/client/favorites/favorites.component').then(m => m.FavoritesComponent) },
      { path: 'profit', loadComponent: () => import('./features/client/profit/client-profit.component').then(m => m.ClientProfitComponent) },
      { path: 'account', loadComponent: () => import('./features/client/account/client-account.component').then(m => m.ClientAccountComponent) },
      { path: 'settings', loadComponent: () => import('./features/client/settings/client-settings.component').then(m => m.ClientSettingsComponent) },
    ],
  },

  {
    path: 'seller',
    loadComponent: () => import('./features/seller/seller-layout.component').then(m => m.SellerLayoutComponent),
    canActivate: [authGuard, roleGuard('vendeur')],
    children: [
      { path: 'scanner', loadComponent: () => import('./features/seller/scanner/scanner.component').then(m => m.ScannerComponent) },
      { path: 'queue', loadComponent: () => import('./features/seller/queue/queue.component').then(m => m.QueueComponent) },
      { path: 'performance', loadComponent: () => import('./features/seller/performance/seller-performance.component').then(m => m.SellerPerformanceComponent) },
      { path: 'stock', loadComponent: () => import('./features/seller/stock/seller-stock.component').then(m => m.SellerStockComponent) },
      { path: 'profit', loadComponent: () => import('./features/seller/profit/seller-profit.component').then(m => m.SellerProfitComponent) },
      { path: 'settings', loadComponent: () => import('./features/seller/settings/seller-settings.component').then(m => m.SellerSettingsComponent) },
      { path: '', redirectTo: 'scanner', pathMatch: 'full' },
    ],
  },

  {
    path: 'manager',
    loadComponent: () => import('./features/manager/manager-layout.component').then(m => m.ManagerLayoutComponent),
    canActivate: [authGuard, roleGuard('manager')],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/manager/dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent) },
      { path: 'stores', loadComponent: () => import('./features/manager/stores/manager-stores.component').then(m => m.ManagerStoresComponent) },
      { path: 'stores/new', loadComponent: () => import('./features/manager/stores/manager-store-create.component').then(m => m.ManagerStoreCreateComponent) },
      { path: 'stores/:id', loadComponent: () => import('./features/manager/stores/manager-store-detail.component').then(m => m.ManagerStoreDetailComponent) },
      { path: 'sellers', loadComponent: () => import('./features/manager/sellers/manager-sellers.component').then(m => m.ManagerSellersComponent) },
      { path: 'analytics', loadComponent: () => import('./features/manager/analytics/manager-analytics.component').then(m => m.ManagerAnalyticsComponent) },
      { path: 'models', loadComponent: () => import('./features/manager/models/manager-models.component').then(m => m.ManagerModelsComponent) },
      { path: 'monitoring', loadComponent: () => import('./features/manager/monitoring/manager-monitoring.component').then(m => m.ManagerMonitoringComponent) },
      { path: 'profit', loadComponent: () => import('./features/manager/profit/manager-profit.component').then(m => m.ManagerProfitComponent) },
      { path: 'settings', loadComponent: () => import('./features/manager/settings/manager-settings.component').then(m => m.ManagerSettingsComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: 'client/feed' },
];

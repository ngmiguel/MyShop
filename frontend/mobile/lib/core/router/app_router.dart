import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../providers/preferences_provider.dart';
import '../../screens/auth/login_screen.dart';
import '../../screens/auth/role_choice_screen.dart';
import '../../screens/client/cart_screen.dart';
import '../../screens/client/checkout_screen.dart';
import '../../screens/client/codes_screen.dart';
import '../../screens/client/compte_screen.dart';
import '../../screens/client/explorer_screen.dart';
import '../../screens/client/favorites_screen.dart';
import '../../screens/client/preferences_screen.dart';
import '../../screens/client/product_detail_screen.dart';
import '../../screens/client/tickets_screen.dart';
import '../../screens/manager/create_store_screen.dart';
import '../../screens/manager/manager_screens.dart';
import '../../screens/manager/monitoring_screen.dart';
import '../../screens/onboarding/onboarding_screen.dart';
import '../../screens/vendeur/vendeur_screens.dart';
import '../../widgets/bottom_nav_shell.dart';

class AppRouter {
  static GoRouter create() {
    return GoRouter(
      initialLocation: '/',
      redirect: (context, state) {
        final prefs = context.read<PreferencesProvider>();
        final auth = context.read<AuthProvider>();
        final loc = state.matchedLocation;

        if (auth.loading) return null;

        if (!prefs.onboardingDone &&
            loc != '/onboarding' &&
            !loc.startsWith('/auth')) {
          return '/onboarding';
        }

        if (loc == '/') {
          if (auth.role == 'manager') return '/manager';
          if (auth.role == 'vendeur') return '/vendeur';
          return '/client';
        }

        if (loc.startsWith('/vendeur') &&
            !loc.startsWith('/auth') &&
            auth.role != 'vendeur') {
          return '/auth/login?role=vendeur';
        }

        if (loc.startsWith('/manager') &&
            !loc.startsWith('/auth') &&
            auth.role != 'manager') {
          return '/auth/login?role=manager';
        }

        return null;
      },
      routes: [
        GoRoute(
          path: '/onboarding',
          builder: (_, __) => const OnboardingScreen(),
        ),
        GoRoute(
          path: '/auth',
          builder: (_, __) => const RoleChoiceScreen(),
          routes: [
            GoRoute(
              path: 'login',
              builder: (context, state) {
                final role = state.uri.queryParameters['role'] ?? 'client';
                return LoginScreen(role: role);
              },
            ),
          ],
        ),
        ShellRoute(
          builder: (context, state, child) {
            return BottomNavShell(
              items: clientNavItems(context),
              currentPath: state.matchedLocation,
              child: child,
            );
          },
          routes: [
            GoRoute(path: '/client', builder: (_, __) => const ExplorerScreen()),
            GoRoute(path: '/client/panier', builder: (_, __) => const CartScreen()),
            GoRoute(path: '/client/codes', builder: (_, __) => const MyCodesScreen()),
            GoRoute(path: '/client/gains', builder: (_, __) => const GainsScreen()),
            GoRoute(path: '/client/parametres', builder: (_, __) => const ClientSettingsScreen()),
          ],
        ),
        GoRoute(path: '/client/favoris', builder: (_, __) => const FavoritesScreen()),
        GoRoute(path: '/client/compte', builder: (_, __) => const CompteScreen()),
        GoRoute(path: '/client/preferences', builder: (_, __) => const PreferencesScreen()),
        GoRoute(path: '/client/tickets', builder: (_, __) => const TicketsScreen()),
        GoRoute(
          path: '/client/produit/:id',
          builder: (_, state) => ProductDetailScreen(productId: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/client/boutique/:id',
          builder: (_, state) => StoreDetailScreen(storeId: state.pathParameters['id']!),
        ),
        GoRoute(path: '/client/checkout', builder: (_, __) => const CheckoutScreen()),
        GoRoute(
          path: '/client/codes/:id',
          builder: (_, state) => CodeDetailScreen(orderId: state.pathParameters['id']!),
        ),
        ShellRoute(
          builder: (context, state, child) {
            return BottomNavShell(
              items: vendeurNavItems(context),
              currentPath: state.matchedLocation,
              child: child,
            );
          },
          routes: [
            GoRoute(path: '/vendeur', builder: (_, __) => const VendeurHomeScreen()),
            GoRoute(path: '/vendeur/scanner', builder: (_, __) => const VendeurScannerScreen()),
            GoRoute(path: '/vendeur/file', builder: (_, __) => const VendeurQueueScreen()),
            GoRoute(path: '/vendeur/profit', builder: (_, __) => const VendeurProfitScreen()),
            GoRoute(path: '/vendeur/parametres', builder: (_, __) => const VendeurSettingsScreen()),
          ],
        ),
        ShellRoute(
          builder: (context, state, child) {
            return BottomNavShell(
              items: managerNavItems(),
              currentPath: state.matchedLocation,
              child: child,
            );
          },
          routes: [
            GoRoute(path: '/manager', builder: (_, __) => const ManagerDashboardScreen()),
            GoRoute(path: '/manager/boutiques', builder: (_, __) => const ManagerStoresScreen()),
            GoRoute(path: '/manager/profit', builder: (_, __) => const ManagerProfitScreen()),
            GoRoute(path: '/manager/equipe', builder: (_, __) => const ManagerTeamScreen()),
            GoRoute(path: '/manager/parametres', builder: (_, __) => const ManagerSettingsScreen()),
          ],
        ),
        GoRoute(path: '/manager/monitoring', builder: (_, __) => const ManagerMonitoringScreen()),
        GoRoute(path: '/manager/boutiques/nouvelle', builder: (_, __) => const CreateStoreScreen()),
        GoRoute(
          path: '/manager/boutiques/:id',
          builder: (_, state) => ManagerStoreDetailScreen(storeId: state.pathParameters['id']!),
        ),
      ],
    );
  }
}

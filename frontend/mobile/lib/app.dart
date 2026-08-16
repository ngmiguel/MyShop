import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'data/services/api_client.dart';
import 'data/services/analytics_service.dart';
import 'data/services/auth_service.dart';
import 'data/services/catalog_service.dart';
import 'data/services/order_service.dart';
import 'data/services/storage_service.dart';
import 'data/services/store_service.dart';
import 'data/services/user_service.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/catalog_provider.dart';
import 'providers/favorites_provider.dart';
import 'providers/orders_provider.dart';
import 'providers/preferences_provider.dart';
import 'providers/profit_settings_provider.dart';
import 'widgets/common_widgets.dart';

class MyShopApp extends StatefulWidget {
  const MyShopApp({super.key});

  @override
  State<MyShopApp> createState() => _MyShopAppState();
}

class _MyShopAppState extends State<MyShopApp> {
  late final StorageService _storage;
  late final ApiClient _apiClient;
  late final AuthService _authService;
  late final CatalogService _catalogService;
  late final StoreService _storeService;
  late final OrderService _orderService;
  late final SellerApiService _sellerApiService;
  late final UserService _userService;
  late final AnalyticsService _analyticsService;
  late final FavoritesProvider _favoritesProvider;
  late final AuthProvider _authProvider;
  late final PreferencesProvider _preferencesProvider;
  late final ProfitSettingsProvider _profitSettingsProvider;
  late final CatalogProvider _catalogProvider;
  late final CartProvider _cartProvider;
  late final OrdersProvider _ordersProvider;
  late final GoRouter _router;
  bool _ready = false;

  @override
  void initState() {
    super.initState();
    _bootstrap();
  }

  Future<void> _bootstrap() async {
    _storage = StorageService();
    _apiClient = ApiClient(_storage);
    _authService = AuthService(_apiClient);
    _catalogService = CatalogService(_apiClient);
    _storeService = StoreService(_apiClient);
    _orderService = OrderService(_apiClient);
    _sellerApiService = SellerApiService(_apiClient);
    _userService = UserService(_apiClient);
    _analyticsService = AnalyticsService(_apiClient);

    _authProvider = AuthProvider(
      storage: _storage,
      apiClient: _apiClient,
      authService: _authService,
    );
    _preferencesProvider = PreferencesProvider(_storage);
    _profitSettingsProvider = ProfitSettingsProvider();
    _catalogProvider = CatalogProvider(_catalogService, _storeService);
    _cartProvider = CartProvider(_orderService, _authProvider);
    _ordersProvider = OrdersProvider(_orderService, _authProvider);
    _favoritesProvider = FavoritesProvider(_storage, _userService, _authProvider);

    await Future.wait([
      _authProvider.init(),
      _preferencesProvider.init(),
      _profitSettingsProvider.init(),
      _favoritesProvider.init(),
    ]);

    await Future.wait([
      _catalogProvider.loadFeed(),
      _cartProvider.loadCart(),
      _ordersProvider.loadOrders(),
    ]);

    _router = AppRouter.create(
      auth: _authProvider,
      preferences: _preferencesProvider,
    );

    if (mounted) {
      setState(() => _ready = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!_ready) {
      return MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        home: const Scaffold(body: LoadingView(message: 'Chargement de MyShop...')),
      );
    }

    return MultiProvider(
      providers: [
        Provider.value(value: _storeService),
        Provider.value(value: _userService),
        Provider.value(value: _analyticsService),
        Provider.value(value: _sellerApiService),
        ChangeNotifierProvider.value(value: _authProvider),
        ChangeNotifierProvider.value(value: _preferencesProvider),
        ChangeNotifierProvider.value(value: _profitSettingsProvider),
        ChangeNotifierProvider.value(value: _favoritesProvider),
        ChangeNotifierProvider.value(value: _catalogProvider),
        ChangeNotifierProvider.value(value: _cartProvider),
        ChangeNotifierProvider.value(value: _ordersProvider),
      ],
      child: Consumer<PreferencesProvider>(
        builder: (context, prefs, _) {
          final p = prefs.preferences;
          return MaterialApp.router(
            title: 'MyShop',
            debugShowCheckedModeBanner: false,
            theme: AppTheme.light().copyWith(visualDensity: p.visualDensity),
            darkTheme: AppTheme.dark().copyWith(visualDensity: p.visualDensity),
            themeMode: switch (p.themeMode) {
              'sombre' => ThemeMode.dark,
              'clair' => ThemeMode.light,
              _ => ThemeMode.system,
            },
            builder: (context, child) {
              final media = MediaQuery.of(context);
              return MediaQuery(
                data: media.copyWith(
                  textScaler: TextScaler.linear(p.textScaleFactor),
                  disableAnimations: p.reduceMotion || media.disableAnimations,
                ),
                child: child ?? const SizedBox.shrink(),
              );
            },
            routerConfig: _router,
          );
        },
      ),
    );
  }
}

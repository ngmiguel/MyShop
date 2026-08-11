import 'dart:io';

import 'package:flutter/foundation.dart';

class ApiConfig {
  static const int port = 8080;
  static const String apiPrefix = '/api';

  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:$port$apiPrefix';
    }
    if (Platform.isAndroid) {
      return 'http://10.0.2.2:$port$apiPrefix';
    }
    return 'http://localhost:$port$apiPrefix';
  }

  static const authPath = '/auth';
  static const storesPath = '/stores';
  static const catalogPath = '/catalog';
  static const ordersPath = '/orders';
  static const sellersPath = '/sellers';
}

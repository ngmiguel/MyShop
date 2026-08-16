import 'dart:convert';
import 'dart:math';

import '../../data/models/order.dart';

final _rng = Random();

/// Génère une référence type prototype Boutika : `PAY-XXXX-XXXX`.
String generatePaymentCode() {
  String block() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return List.generate(4, (_) => alphabet[_rng.nextInt(alphabet.length)]).join();
  }

  return 'PAY-${block()}-${block()}';
}

/// Payload QR compatible client (code) + web (ref) + scanner vendeur (reference).
Map<String, dynamic> buildQrPayloadMap(OrderModel order, {String? storeName}) {
  return {
    'v': 1,
    'code': order.reference,
    'ref': order.reference,
    'reference': order.reference,
    'boutique': storeName,
    'boutiqueId': order.storeId,
    'store': order.storeId,
    'client': order.contactName,
    'tel': order.contactPhone,
    'total': order.total,
    'devise': 'FCFA',
    'currency': order.currency,
    'mode': order.fulfillmentMode,
    'methode': order.paymentMethod,
    'items': order.items.fold<int>(0, (s, i) => s + i.quantity),
    'lignes': order.items
        .map((l) => {'n': l.name, 'q': l.quantity, 'p': l.price})
        .toList(),
    'emisLe': (order.createdAt ?? DateTime.now()).toIso8601String(),
    'expire': order.expiresAt.toIso8601String(),
    'issued': (order.createdAt ?? DateTime.now()).toIso8601String(),
    'expires': order.expiresAt.toIso8601String(),
  };
}

String encodeQrPayload(OrderModel order, {String? storeName}) {
  return jsonEncode(buildQrPayloadMap(order, storeName: storeName));
}

/// Extrait la référence depuis un QR JSON ou une saisie manuelle brute.
String? readPaymentReference(String raw) {
  final trimmed = raw.trim();
  if (trimmed.isEmpty) return null;
  try {
    final decoded = jsonDecode(trimmed);
    if (decoded is Map) {
      final code = decoded['code'] ?? decoded['ref'] ?? decoded['reference'];
      if (code != null) return code.toString().trim().toUpperCase();
    }
  } catch (_) {
    /* référence brute */
  }
  return trimmed.toUpperCase();
}

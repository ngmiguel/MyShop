class CartItemModel {
  const CartItemModel({
    required this.productId,
    required this.storeId,
    required this.name,
    required this.price,
    required this.quantity,
    this.imageUrl,
  });

  final String productId;
  final String storeId;
  final String name;
  final double price;
  final int quantity;
  final String? imageUrl;

  double get lineTotal => price * quantity;

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    return CartItemModel(
      productId: json['productId'] as String,
      storeId: json['storeId'] as String,
      name: json['name'] as String,
      price: _toDouble(json['price']),
      quantity: json['quantity'] as int? ?? 1,
      imageUrl: json['imageUrl'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        'productId': productId,
        'storeId': storeId,
        'name': name,
        'price': price,
        'quantity': quantity,
        if (imageUrl != null) 'imageUrl': imageUrl,
      };

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class CartModel {
  const CartModel({
    required this.id,
    required this.items,
    this.promoCode,
  });

  final String id;
  final List<CartItemModel> items;
  final String? promoCode;

  int get itemCount => items.fold(0, (sum, i) => sum + i.quantity);

  double get subtotal =>
      items.fold(0, (sum, i) => sum + i.lineTotal);

  factory CartModel.fromJson(Map<String, dynamic> json) {
    return CartModel(
      id: json['id'] as String? ?? '',
      items: (json['items'] as List? ?? [])
          .map((e) => CartItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      promoCode: json['promoCode'] as String?,
    );
  }
}

class OrderModel {
  const OrderModel({
    required this.id,
    required this.reference,
    required this.storeId,
    required this.items,
    required this.subtotal,
    required this.tax,
    required this.discount,
    required this.total,
    required this.status,
    required this.fulfillmentMode,
    required this.expiresAt,
    this.userId,
    this.currency = 'XOF',
    this.contactName,
    this.contactPhone,
    this.contactEmail,
    this.paymentMethod,
    this.qrPayload,
    this.redeemedAt,
    this.createdAt,
  });

  final String id;
  final String reference;
  final String? userId;
  final String storeId;
  final List<CartItemModel> items;
  final double subtotal;
  final double tax;
  final double discount;
  final double total;
  final String currency;
  final String status;
  final String fulfillmentMode;
  final String? contactName;
  final String? contactPhone;
  final String? contactEmail;
  final String? paymentMethod;
  final String? qrPayload;
  final DateTime expiresAt;
  final DateTime? redeemedAt;
  final DateTime? createdAt;

  bool get isPending => status == 'pending';

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] as String,
      reference: json['reference'] as String,
      userId: json['userId'] as String?,
      storeId: json['storeId'] as String,
      items: (json['items'] as List? ?? [])
          .map((e) => CartItemModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      subtotal: _toDouble(json['subtotal']),
      tax: _toDouble(json['tax']),
      discount: _toDouble(json['discount']),
      total: _toDouble(json['total']),
      currency: json['currency'] as String? ?? 'XOF',
      status: json['status'] as String? ?? 'pending',
      fulfillmentMode: json['fulfillmentMode'] as String? ?? 'pickup',
      contactName: json['contactName'] as String?,
      contactPhone: json['contactPhone'] as String?,
      contactEmail: json['contactEmail'] as String?,
      paymentMethod: json['paymentMethod'] as String?,
      qrPayload: json['qrPayload'] as String?,
      expiresAt: DateTime.parse(json['expiresAt'] as String),
      redeemedAt: json['redeemedAt'] != null
          ? DateTime.parse(json['redeemedAt'] as String)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class SellerModel {
  const SellerModel({
    required this.id,
    required this.storeId,
    required this.status,
    this.userId,
    this.firstName,
    this.lastName,
    this.email,
  });

  final String id;
  final String storeId;
  final String status;
  final String? userId;
  final String? firstName;
  final String? lastName;
  final String? email;

  String get displayName {
    if (firstName != null) return '$firstName ${lastName ?? ''}'.trim();
    return email ?? 'Vendeur';
  }

  factory SellerModel.fromJson(Map<String, dynamic> json) {
    return SellerModel(
      id: json['id'] as String,
      storeId: json['storeId'] as String,
      status: json['status'] as String? ?? 'pending',
      userId: json['userId'] as String?,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      email: json['email'] as String?,
    );
  }
}

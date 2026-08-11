class ProductModel {
  const ProductModel({
    required this.id,
    required this.name,
    required this.storeId,
    required this.price,
    this.description,
    this.compareAtPrice,
    this.stock = 0,
    this.imageUrl,
    this.currency = 'XOF',
    this.categoryId,
    this.subcategoryId,
    this.isActive = true,
  });

  final String id;
  final String name;
  final String storeId;
  final double price;
  final String? description;
  final double? compareAtPrice;
  final int stock;
  final String? imageUrl;
  final String currency;
  final String? categoryId;
  final String? subcategoryId;
  final bool isActive;

  bool get inStock => stock > 0;
  bool get onPromo => compareAtPrice != null && compareAtPrice! > price;
  double? get promoPrice => onPromo ? price : null;
  double get displayPrice => price;

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] as String,
      name: json['name'] as String,
      storeId: json['storeId'] as String,
      price: _toDouble(json['price']),
      description: json['description'] as String?,
      compareAtPrice: json['compareAtPrice'] != null
          ? _toDouble(json['compareAtPrice'])
          : null,
      stock: json['stock'] as int? ?? 0,
      imageUrl: json['imageUrl'] as String?,
      currency: json['currency'] as String? ?? 'XOF',
      categoryId: json['categoryId'] as String?,
      subcategoryId: json['subcategoryId'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  static double _toDouble(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0;
  }
}

class ProductListResponse {
  const ProductListResponse({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });

  final List<ProductModel> items;
  final int total;
  final int page;
  final int limit;

  factory ProductListResponse.fromJson(dynamic json) {
    if (json is List) {
      return ProductListResponse(
        items: json
            .map((e) => ProductModel.fromJson(e as Map<String, dynamic>))
            .toList(),
        total: json.length,
        page: 1,
        limit: json.length,
      );
    }
    final map = json as Map<String, dynamic>;
    final data = map['data'] ?? map['items'] ?? map['products'] ?? [];
    return ProductListResponse(
      items: (data as List)
          .map((e) => ProductModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: map['total'] as int? ?? (data as List).length,
      page: map['page'] as int? ?? 1,
      limit: map['limit'] as int? ?? 20,
    );
  }
}

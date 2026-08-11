class StoreModel {
  const StoreModel({
    required this.id,
    required this.name,
    required this.city,
    this.tagline,
    this.shortDescription,
    this.description,
    this.logoUrl,
    this.photos = const [],
    this.address,
    this.phone,
    this.email,
    this.status = 'active',
    this.mainCategory,
    this.categories = const [],
    this.delivery = false,
    this.pickup = true,
    this.lat,
    this.lng,
    this.serviceRadiusKm,
  });

  final String id;
  final String name;
  final String city;
  final String? tagline;
  final String? shortDescription;
  final String? description;
  final String? logoUrl;
  final List<String> photos;
  final String? address;
  final String? phone;
  final String? email;
  final String status;
  final String? mainCategory;
  final List<String> categories;
  final bool delivery;
  final bool pickup;
  final double? lat;
  final double? lng;
  final double? serviceRadiusKm;

  String? get coverUrl {
    if (photos.isNotEmpty) return photos.first;
    return logoUrl;
  }

  factory StoreModel.fromJson(Map<String, dynamic> json) {
    return StoreModel(
      id: json['id'] as String,
      name: json['name'] as String,
      city: json['city'] as String? ?? '',
      tagline: json['tagline'] as String?,
      shortDescription: json['shortDescription'] as String?,
      description: json['description'] as String?,
      logoUrl: json['logoUrl'] as String?,
      photos: (json['photos'] as List?)?.cast<String>() ?? [],
      address: json['address'] as String?,
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      status: json['status'] as String? ?? 'active',
      mainCategory: json['mainCategory'] as String?,
      categories: (json['categories'] as List?)?.cast<String>() ?? [],
      delivery: json['delivery'] as bool? ?? false,
      pickup: json['pickup'] as bool? ?? true,
      lat: json['lat'] != null ? (json['lat'] as num).toDouble() : null,
      lng: json['lng'] != null ? (json['lng'] as num).toDouble() : null,
      serviceRadiusKm: json['serviceRadiusKm'] != null
          ? (json['serviceRadiusKm'] as num).toDouble()
          : null,
    );
  }
}

class OpeningHoursDay {
  const OpeningHoursDay({
    required this.day,
    this.open = '08:30',
    this.close = '19:00',
    this.closed = false,
  });

  final String day;
  final String open;
  final String close;
  final bool closed;

  OpeningHoursDay copyWith({
    String? day,
    String? open,
    String? close,
    bool? closed,
  }) {
    return OpeningHoursDay(
      day: day ?? this.day,
      open: open ?? this.open,
      close: close ?? this.close,
      closed: closed ?? this.closed,
    );
  }

  Map<String, dynamic> toJson() => {
        'day': day,
        'open': open,
        'close': close,
        'closed': closed,
      };

  factory OpeningHoursDay.fromJson(Map<String, dynamic> json) {
    return OpeningHoursDay(
      day: json['day'] as String? ?? json['jour'] as String? ?? '',
      open: json['open'] as String? ?? json['ouverture'] as String? ?? '08:30',
      close: json['close'] as String? ?? json['fermeture'] as String? ?? '19:00',
      closed: json['closed'] as bool? ?? json['ferme'] as bool? ?? false,
    );
  }
}

const openingDays = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

List<OpeningHoursDay> defaultOpeningHours() => [
      for (final d in openingDays)
        OpeningHoursDay(day: d, closed: d == 'Dimanche'),
    ];

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
    this.whatsapp,
    this.status = 'active',
    this.mainCategory,
    this.categories = const [],
    this.tags = const [],
    this.delivery = false,
    this.pickup = true,
    this.lat,
    this.lng,
    this.serviceRadiusKm,
    this.deliveryFee,
    this.rating,
    this.reviewCount,
    this.country = 'Cameroun',
    this.createdAt,
    this.accessCode,
    this.paymentMethods = const ['Espèces', 'Mobile Money'],
    this.currency = 'FCFA',
    this.openingHours = const [],
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
  final String? whatsapp;
  final String status;
  final String? mainCategory;
  final List<String> categories;
  final List<String> tags;
  final bool delivery;
  final bool pickup;
  final double? lat;
  final double? lng;
  final double? serviceRadiusKm;
  final double? deliveryFee;
  final double? rating;
  final int? reviewCount;
  final String country;
  final DateTime? createdAt;
  final String? accessCode;
  final List<String> paymentMethods;
  final String currency;
  final List<OpeningHoursDay> openingHours;

  String? get coverUrl {
    if (photos.isNotEmpty) return photos.first;
    return logoUrl;
  }

  List<OpeningHoursDay> get horaires =>
      openingHours.isNotEmpty ? openingHours : defaultOpeningHours();

  double get note {
    if (rating != null) return rating!;
    final seed = id.codeUnits.fold(0, (a, c) => a + c);
    return 3.5 + (seed % 15) / 10;
  }

  int get avis {
    if (reviewCount != null) return reviewCount!;
    return 18 + (id.hashCode.abs() % 210);
  }

  String get statusLabel {
    switch (status) {
      case 'pause':
        return 'Pause';
      case 'brouillon':
      case 'draft':
        return 'Brouillon';
      case 'active':
      default:
        return 'Active';
    }
  }

  bool get isActive => status == 'active';
  bool get isPaused => status == 'pause';
  bool get isDraft => status == 'brouillon' || status == 'draft';

  StoreModel copyWith({
    String? id,
    String? name,
    String? city,
    String? tagline,
    String? shortDescription,
    String? description,
    String? logoUrl,
    List<String>? photos,
    String? address,
    String? phone,
    String? email,
    String? whatsapp,
    String? status,
    String? mainCategory,
    List<String>? categories,
    List<String>? tags,
    bool? delivery,
    bool? pickup,
    double? lat,
    double? lng,
    double? serviceRadiusKm,
    double? deliveryFee,
    double? rating,
    int? reviewCount,
    String? country,
    DateTime? createdAt,
    String? accessCode,
    List<String>? paymentMethods,
    String? currency,
    List<OpeningHoursDay>? openingHours,
  }) {
    return StoreModel(
      id: id ?? this.id,
      name: name ?? this.name,
      city: city ?? this.city,
      tagline: tagline ?? this.tagline,
      shortDescription: shortDescription ?? this.shortDescription,
      description: description ?? this.description,
      logoUrl: logoUrl ?? this.logoUrl,
      photos: photos ?? this.photos,
      address: address ?? this.address,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      whatsapp: whatsapp ?? this.whatsapp,
      status: status ?? this.status,
      mainCategory: mainCategory ?? this.mainCategory,
      categories: categories ?? this.categories,
      tags: tags ?? this.tags,
      delivery: delivery ?? this.delivery,
      pickup: pickup ?? this.pickup,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      serviceRadiusKm: serviceRadiusKm ?? this.serviceRadiusKm,
      deliveryFee: deliveryFee ?? this.deliveryFee,
      rating: rating ?? this.rating,
      reviewCount: reviewCount ?? this.reviewCount,
      country: country ?? this.country,
      createdAt: createdAt ?? this.createdAt,
      accessCode: accessCode ?? this.accessCode,
      paymentMethods: paymentMethods ?? this.paymentMethods,
      currency: currency ?? this.currency,
      openingHours: openingHours ?? this.openingHours,
    );
  }

  factory StoreModel.fromJson(Map<String, dynamic> json) {
    final hoursRaw = json['openingHours'] ?? json['horaires'];
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
      whatsapp: json['whatsapp'] as String?,
      status: json['status'] as String? ?? 'active',
      mainCategory: json['mainCategory'] as String?,
      categories: (json['categories'] as List?)?.cast<String>() ?? [],
      tags: (json['tags'] as List?)?.cast<String>() ?? [],
      delivery: json['delivery'] as bool? ?? false,
      pickup: json['pickup'] as bool? ?? true,
      lat: json['lat'] != null ? (json['lat'] as num).toDouble() : null,
      lng: json['lng'] != null ? (json['lng'] as num).toDouble() : null,
      serviceRadiusKm: json['serviceRadiusKm'] != null
          ? (json['serviceRadiusKm'] as num).toDouble()
          : null,
      deliveryFee: json['deliveryFee'] != null
          ? (json['deliveryFee'] as num).toDouble()
          : null,
      rating: json['rating'] != null ? (json['rating'] as num).toDouble() : null,
      reviewCount: json['reviewCount'] as int? ?? json['avis'] as int?,
      country: json['country'] as String? ?? 'Cameroun',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      accessCode: json['accessCode'] as String? ?? json['motDePasse'] as String?,
      paymentMethods: (json['paymentMethods'] as List?)?.cast<String>() ??
          const ['Espèces', 'Mobile Money'],
      currency: json['currency'] as String? ?? 'FCFA',
      openingHours: hoursRaw is List
          ? hoursRaw
              .map((e) => OpeningHoursDay.fromJson(e as Map<String, dynamic>))
              .toList()
          : const [],
    );
  }
}

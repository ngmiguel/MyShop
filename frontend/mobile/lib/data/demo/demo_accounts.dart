import '../models/store.dart';
import '../models/user.dart';
import 'demo_catalog.dart' as catalog;

class DemoSellerAccount {
  const DemoSellerAccount({
    required this.email,
    required this.password,
    required this.storeId,
    required this.firstName,
    required this.lastName,
    this.status = 'active',
    this.phone,
    this.jobTitle,
    this.hireDate,
    this.rating,
    this.reviewCount,
    this.confirmedScans,
    this.generatedRevenue,
  });

  final String email;
  final String password;
  final String storeId;
  final String firstName;
  final String lastName;
  final String status;
  final String? phone;
  final String? jobTitle;
  final DateTime? hireDate;
  final double? rating;
  final int? reviewCount;
  final int? confirmedScans;
  final double? generatedRevenue;

  String get displayName => '$firstName $lastName'.trim();

  double get note {
    if (rating != null) return rating!;
    if (effectiveStatus == 'pending') return 0;
    final seed = email.codeUnits.fold(0, (a, c) => a + c);
    return 3.6 + (seed % 14) / 10;
  }

  int get avis {
    if (reviewCount != null) return reviewCount!;
    if (effectiveStatus == 'pending') return 0;
    return 8 + (email.hashCode.abs() % 90);
  }

  int get scansConfirmes {
    if (confirmedScans != null) return confirmedScans!;
    if (effectiveStatus == 'pending') return 0;
    return 12 + (email.hashCode.abs() % 180);
  }

  double get caGenere {
    if (generatedRevenue != null) return generatedRevenue!;
    if (effectiveStatus == 'pending') return 0;
    return (180000 + (email.hashCode.abs() % 900) * 10000).toDouble();
  }

  DateTime get embauche {
    if (hireDate != null) return hireDate!;
    final days = 30 + (email.hashCode.abs() % 400);
    return DateTime.now().subtract(Duration(days: days));
  }

  String get poste {
    if (jobTitle != null && jobTitle!.isNotEmpty) return jobTitle!;
    final options = sellerJobTitles;
    return options[email.hashCode.abs() % options.length];
  }

  String get telephone {
    if (phone != null && phone!.isNotEmpty) return phone!;
    final n = 600000000 + (email.hashCode.abs() % 89999999);
    return '+237 ${n.toString().substring(0, 1)} ${n.toString().substring(1, 3)} ${n.toString().substring(3, 5)} ${n.toString().substring(5, 7)} ${n.toString().substring(7)}';
  }

  String get effectiveStatus => demoSellerStatusOverride(email) ?? status;

  String get initials {
    final a = firstName.isNotEmpty ? firstName[0] : 'V';
    final b = lastName.isNotEmpty ? lastName[0] : '';
    return '$a$b'.toUpperCase();
  }

  String get statusLabel {
    switch (effectiveStatus) {
      case 'pending':
      case 'en_attente':
        return 'En attente';
      case 'suspended':
      case 'suspendu':
        return 'Suspendu';
      case 'active':
      case 'actif':
      default:
        return 'Actif';
    }
  }

  bool get isActive => effectiveStatus == 'active' || effectiveStatus == 'actif';
  bool get isPending => effectiveStatus == 'pending' || effectiveStatus == 'en_attente';
  bool get isSuspended => effectiveStatus == 'suspended' || effectiveStatus == 'suspendu';
}

class DemoGoogleAccount {
  const DemoGoogleAccount({
    required this.email,
    required this.nom,
    required this.initiales,
  });

  final String email;
  final String nom;
  final String initiales;
}

class GoogleScope {
  const GoogleScope(this.title, this.detail);
  final String title;
  final String detail;
}

const demoManagerEmail = 'manager@boutik.app';
const demoManagerPassword = 'manager2026';

/// Comptes Gmail proposés dans la feuille Google (prototype).
const demoGoogleAccounts = [
  DemoGoogleAccount(email: 'awa.kone@gmail.com', nom: 'Awa Koné', initiales: 'AK'),
  DemoGoogleAccount(email: 'ibrahim.toure@gmail.com', nom: 'Ibrahim Touré', initiales: 'IT'),
];

const googleScopes = [
  GoogleScope('Profil de base', 'Nom, adresse e-mail et photo de profil'),
  GoogleScope('Gmail — envoi de reçus', 'Envoyer vos tickets de caisse à votre boîte'),
  GoogleScope('Google Drive (dossier app)', 'Sauvegarder préférences, favoris et panier'),
  GoogleScope('Contacts (facultatif)', 'Préremplir vos coordonnées au paiement'),
  GoogleScope('Agenda (facultatif)', 'Rappels de retrait en boutique'),
];

/// Mots de passe d'affiliation boutique (inscription vendeur).
const demoStoreAccessCodes = <String, String>{
  'demo-store-1': 'FRAICHEUR-2481',
  'demo-store-2': 'DIGITAL-7734',
  'demo-store-3': 'BATIR-1902',
  'st-4': 'WAX-5560',
  'st-5': 'AUTO-8821',
  'st-6': 'BEAUTY-3340',
  'st-7': 'SPORT-1209',
  'st-8': 'LIVRE-7741',
  'st-9': 'KIDS-4412',
  'st-10': 'ART-9088',
  'st-11': 'SOLAR-6610',
  'st-12': 'AGRO-2299',
};

/// Boutiques proposées à la connexion vendeur (toutes celles du catalogue).
List<StoreModel> get demoStores => catalog.demoStores;

/// Liste mutable pour les inscriptions démo en session.
final List<DemoSellerAccount> _registeredSellers = [];

/// Overrides de statut (validation / suspension) pour la session.
final Map<String, String> _sellerStatusOverrides = {};

String? demoSellerStatusOverride(String email) => _sellerStatusOverrides[email.trim().toLowerCase()];

void setDemoSellerStatus(String email, String status) {
  _sellerStatusOverrides[email.trim().toLowerCase()] = status;
}

List<DemoSellerAccount> get demoSellers => [..._seedSellers, ..._registeredSellers];

final _seedSellers = [
  DemoSellerAccount(
    email: 'kofi.vendeur@myshop.app',
    password: 'Vendeur2026!',
    storeId: 'demo-store-1',
    firstName: 'Kofi',
    lastName: 'Mensah',
    phone: '+237 6 77 12 44 01',
    jobTitle: 'Responsable de rayon',
    hireDate: DateTime(2025, 11, 20),
    rating: 4.7,
    reviewCount: 48,
    confirmedScans: 312,
    generatedRevenue: 4200000,
  ),
  DemoSellerAccount(
    email: 'grace.nkolo@boutika.cm',
    password: 'Vendeur2026!',
    storeId: 'demo-store-1',
    firstName: 'Grace',
    lastName: 'Nkolo',
    phone: '+237 6 55 90 12 02',
    jobTitle: 'Vendeuse',
    hireDate: DateTime(2026, 1, 12),
    rating: 4.5,
    reviewCount: 33,
    confirmedScans: 198,
    generatedRevenue: 2650000,
  ),
  DemoSellerAccount(
    email: 'aicha.vendeur@myshop.app',
    password: 'Vendeur2026!',
    storeId: 'demo-store-2',
    firstName: 'Aïcha',
    lastName: 'Traoré',
    phone: '+237 6 99 45 10 03',
    jobTitle: 'Conseillère technique',
    hireDate: DateTime(2025, 11, 20),
    rating: 4.8,
    reviewCount: 62,
    confirmedScans: 418,
    generatedRevenue: 7420000,
  ),
  DemoSellerAccount(
    email: 'kouassi@digitalcorner.cm',
    password: 'Vendeur2026!',
    storeId: 'demo-store-2',
    firstName: 'Kouassi',
    lastName: "N'Guessan",
    phone: '+237 6 91 33 44 10',
    jobTitle: 'Conseiller technique',
    hireDate: DateTime(2026, 2, 2),
    rating: 4.5,
    reviewCount: 40,
    confirmedScans: 265,
    generatedRevenue: 11250000,
  ),
  DemoSellerAccount(
    email: 'estelle@atelierbatir.cm',
    password: 'Vendeur2026!',
    storeId: 'demo-store-3',
    firstName: 'Estelle',
    lastName: 'Yao',
    phone: '+237 6 72 88 11 05',
    jobTitle: 'Caissière',
    hireDate: DateTime(2026, 3, 8),
    rating: 4.6,
    reviewCount: 27,
    confirmedScans: 154,
    generatedRevenue: 3180000,
  ),
  DemoSellerAccount(
    email: 'fatou@modewax.cm',
    password: 'Vendeur2026!',
    storeId: 'st-4',
    firstName: 'Fatou',
    lastName: 'Diallo',
    phone: '+237 6 45 77 82 30',
    jobTitle: 'Vendeuse',
    hireDate: DateTime(2026, 3, 14),
    rating: 4.9,
    reviewCount: 91,
    confirmedScans: 602,
    generatedRevenue: 5310000,
  ),
  DemoSellerAccount(
    email: 'yann.kouadio@digitalcorner.cm',
    password: 'Vendeur2026!',
    storeId: 'demo-store-2',
    firstName: 'Yann',
    lastName: 'Kouadio',
    status: 'pending',
    phone: '+237 6 12 88 45 02',
    jobTitle: 'Vendeur',
    hireDate: DateTime(2026, 7, 28),
    rating: 0,
    reviewCount: 0,
    confirmedScans: 0,
    generatedRevenue: 0,
  ),
  DemoSellerAccount(
    email: 'mariam@beautypalace.cm',
    password: 'Vendeur2026!',
    storeId: 'st-6',
    firstName: 'Mariam',
    lastName: 'Coulibaly',
    status: 'suspended',
    phone: '+237 6 04 12 66 74',
    jobTitle: 'Conseillère beauté',
    hireDate: DateTime(2026, 5, 25),
    rating: 3.8,
    reviewCount: 17,
    confirmedScans: 74,
    generatedRevenue: 890000,
  ),
  DemoSellerAccount(
    email: 'bakary@atelierbatir.cm',
    password: 'Vendeur2026!',
    storeId: 'demo-store-3',
    firstName: 'Bakary',
    lastName: 'Camara',
    phone: '+237 6 88 21 45 67',
    jobTitle: 'Conseiller technique',
    hireDate: DateTime(2025, 9, 3),
    rating: 4.4,
    reviewCount: 29,
    confirmedScans: 221,
    generatedRevenue: 3890000,
  ),
  DemoSellerAccount(
    email: 'nadia@modewax.cm',
    password: 'Vendeur2026!',
    storeId: 'st-4',
    firstName: 'Nadia',
    lastName: 'Sarr',
    phone: '+237 6 33 70 18 92',
    jobTitle: 'Responsable de rayon',
    hireDate: DateTime(2026, 1, 8),
    rating: 4.6,
    reviewCount: 54,
    confirmedScans: 347,
    generatedRevenue: 6120000,
  ),
  DemoSellerAccount(
    email: 'salif@autoservice.cm',
    password: 'Vendeur2026!',
    storeId: 'st-5',
    firstName: 'Salif',
    lastName: 'Keita',
    status: 'pending',
    phone: '+237 6 19 55 03 41',
    jobTitle: 'Vendeur',
    hireDate: DateTime(2026, 8, 1),
    rating: 0,
    reviewCount: 0,
    confirmedScans: 0,
    generatedRevenue: 0,
  ),
];

DemoSellerAccount? findDemoSeller({required String storeId, required String email}) {
  final normalized = email.trim().toLowerCase();
  try {
    return demoSellers.firstWhere(
      (s) => s.storeId == storeId && s.email.toLowerCase() == normalized,
    );
  } catch (_) {
    return null;
  }
}

bool emailAlreadyUsed(String email) {
  final normalized = email.trim().toLowerCase();
  return demoSellers.any((s) => s.email.toLowerCase() == normalized);
}

String? storeAccessCode(String storeId) => demoStoreAccessCodes[storeId];

void addRegisteredDemoSeller(DemoSellerAccount seller) {
  _registeredSellers.removeWhere((s) => s.email.toLowerCase() == seller.email.toLowerCase());
  _registeredSellers.add(seller);
}

UserModel? demoManagerUser(String email, String password) {
  final normalized = email.trim().toLowerCase();
  if (normalized == demoManagerEmail && password == demoManagerPassword) {
    return const UserModel(
      id: 'demo-manager-1',
      email: demoManagerEmail,
      role: 'manager',
      firstName: 'Directeur',
      lastName: 'Groupe Boutik',
    );
  }
  if (normalized == 'manager@myshop.app' && password == 'Manager2026!') {
    return const UserModel(
      id: 'demo-manager-1',
      email: 'manager@myshop.app',
      role: 'manager',
      firstName: 'Manager',
      lastName: 'Boutika',
    );
  }
  return null;
}

UserModel demoGoogleUser({
  String email = 'awa.kone@gmail.com',
  String? firstName,
  String? lastName,
}) {
  final known = {
    for (final c in demoGoogleAccounts)
      c.email: (
        c.nom.split(' ').first,
        c.nom.split(' ').skip(1).join(' ').isEmpty ? 'Boutika' : c.nom.split(' ').skip(1).join(' '),
      ),
  };
  final pair = known[email.trim().toLowerCase()];
  if (firstName != null || lastName != null) {
    return UserModel(
      id: 'demo-client-1',
      email: email,
      role: 'client',
      firstName: firstName?.isNotEmpty == true ? firstName! : 'Client',
      lastName: lastName?.isNotEmpty == true ? lastName! : 'Boutika',
    );
  }
  if (pair != null) {
    return UserModel(
      id: 'demo-client-1',
      email: email,
      role: 'client',
      firstName: pair.$1,
      lastName: pair.$2,
    );
  }
  final local = email.split('@').first;
  return UserModel(
    id: 'demo-client-1',
    email: email,
    role: 'client',
    firstName: local.isNotEmpty ? local[0].toUpperCase() + local.substring(1) : 'Client',
    lastName: 'Boutika',
  );
}

List<String> suggestedDomains() => ['agro', 'technologie', 'style', 'beaute', 'materiaux'];

const sellerJobTitles = [
  'Vendeur',
  'Vendeuse',
  'Conseiller technique',
  'Conseillère technique',
  'Conseillère beauté',
  'Responsable de rayon',
  'Caissier',
  'Caissière',
  'Stagiaire',
];

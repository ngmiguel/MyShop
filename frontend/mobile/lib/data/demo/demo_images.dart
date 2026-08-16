import '../models/product.dart';
import '../models/store.dart';

/// Images Unsplash stables — catalogues élargis pour coller au prototype Boutika.
const storefrontImage =
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80&auto=format&fit=crop';

const storeInteriorImage =
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&q=80&auto=format&fit=crop';

const marketStallImage =
    'https://images.unsplash.com/photo-1488459716781-31db5254d874?w=1200&q=80&auto=format&fit=crop';

const fashionBoutiqueImage =
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1200&q=80&auto=format&fit=crop';

const categoryImages = <String, String>{
  'agro': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&auto=format&fit=crop',
  'animaux': 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80&auto=format&fit=crop',
  'vehicules': 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80&auto=format&fit=crop',
  'materiaux': 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop',
  'technologie': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80&auto=format&fit=crop',
  'tech': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80&auto=format&fit=crop',
  'bijoux': 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80&auto=format&fit=crop',
  'style': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80&auto=format&fit=crop',
  'maison': 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80&auto=format&fit=crop',
  'beaute': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80&auto=format&fit=crop',
  'sport': 'https://images.unsplash.com/photo-1517649763962-0c62306601b7?w=800&q=80&auto=format&fit=crop',
  'culture': 'https://images.unsplash.com/photo-1495446815901-a72907e633e8?w=800&q=80&auto=format&fit=crop',
  'livres': 'https://images.unsplash.com/photo-1495446815901-a72907e633e8?w=800&q=80&auto=format&fit=crop',
  'enfance': 'https://images.unsplash.com/photo-1558062567-647105793c8f?w=800&q=80&auto=format&fit=crop',
  'jouets': 'https://images.unsplash.com/photo-1558062567-647105793c8f?w=800&q=80&auto=format&fit=crop',
  'artisanat': 'https://images.unsplash.com/photo-1460661419201-fd4ceffd8dfa?w=800&q=80&auto=format&fit=crop',
  'art': 'https://images.unsplash.com/photo-1460661419201-fd4ceffd8dfa?w=800&q=80&auto=format&fit=crop',
  'energie': 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80&auto=format&fit=crop',
  'agriculture': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80&auto=format&fit=crop',
  'services': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80&auto=format&fit=crop',
  'sante': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&q=80&auto=format&fit=crop',
  'industrie': 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80&auto=format&fit=crop',
};

const productImagePool = <String, List<String>>{
  'agro': [
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1566385101042-f4141140a6b0?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1610832958506-aa563681de1b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1488459716781-31db5254d874?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516594798947-e5957563082b?w=800&q=80&auto=format&fit=crop',
  ],
  'animaux': [
    'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1516467508483-aade25acb4e8?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=800&q=80&auto=format&fit=crop',
  ],
  'vehicules': [
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop',
  ],
  'materiaux': [
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80&auto=format&fit=crop',
  ],
  'technologie': [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1468495244123-6c6c33245ce1?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1587825140708-dfaf7ae4be04?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80&auto=format&fit=crop',
  ],
  'tech': [
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&auto=format&fit=crop',
  ],
  'bijoux': [
    'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80&auto=format&fit=crop',
  ],
  'style': [
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e3685b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80&auto=format&fit=crop',
  ],
  'maison': [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=800&q=80&auto=format&fit=crop',
  ],
  'beaute': [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80&auto=format&fit=crop',
  ],
  'sport': [
    'https://images.unsplash.com/photo-1517649763962-0c62306601b7?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1461896836934-ffe607ba6851?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80&auto=format&fit=crop',
  ],
  'culture': [
    'https://images.unsplash.com/photo-1495446815901-a72907e633e8?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512820790801-4153ccae8e8f?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-14565130808af52-0bfdaafb0e8c?w=800&q=80&auto=format&fit=crop',
  ],
  'livres': [
    'https://images.unsplash.com/photo-1495446815901-a72907e633e8?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1512820790801-4153ccae8e8f?w=800&q=80&auto=format&fit=crop',
  ],
  'enfance': [
    'https://images.unsplash.com/photo-1558062567-647105793c8f?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80&auto=format&fit=crop',
  ],
  'jouets': [
    'https://images.unsplash.com/photo-1558062567-647105793c8f?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80&auto=format&fit=crop',
  ],
  'artisanat': [
    'https://images.unsplash.com/photo-1460661419201-fd4ceffd8dfa?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=800&q=80&auto=format&fit=crop',
  ],
  'art': [
    'https://images.unsplash.com/photo-1460661419201-fd4ceffd8dfa?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80&auto=format&fit=crop',
  ],
  'energie': [
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ce1f?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559302504-64aae6ca6c9e?w=800&q=80&auto=format&fit=crop',
  ],
  'agriculture': [
    'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1574943320210-553eb761f935?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop',
  ],
  'services': [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80&auto=format&fit=crop',
  ],
};

const storeCoverPool = <String, List<String>>{
  'agro': [marketStallImage, storefrontImage, storeInteriorImage],
  'technologie': [
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1200&q=80&auto=format&fit=crop',
    storefrontImage,
    storeInteriorImage,
  ],
  'style': [fashionBoutiqueImage, storefrontImage, storeInteriorImage],
  'materiaux': [
    'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80&auto=format&fit=crop',
    storeInteriorImage,
    storefrontImage,
  ],
  'vehicules': [
    'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&q=80&auto=format&fit=crop',
    storefrontImage,
    storeInteriorImage,
  ],
  'beaute': [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80&auto=format&fit=crop',
    storeInteriorImage,
    storefrontImage,
  ],
  'energie': [
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80&auto=format&fit=crop',
    storefrontImage,
    storeInteriorImage,
  ],
};

int _hashId(String id) => id.split('').fold(0, (a, c) => a + c.codeUnitAt(0));

String resolveCategoryImageKey(String? categoryId) {
  if (categoryId == null || categoryId.isEmpty) return 'agro';
  if (categoryImages.containsKey(categoryId)) return categoryId;
  if (categoryId.contains('tech')) return 'technologie';
  if (categoryId.contains('agro') || categoryId.contains('aliment')) return 'agro';
  if (categoryId.contains('livre')) return 'culture';
  if (categoryId.contains('jouet')) return 'enfance';
  if (categoryId.contains('art')) return 'artisanat';
  return categoryId;
}

String productImageUrl({required String productId, String? categoryId}) {
  final key = resolveCategoryImageKey(categoryId);
  final pool = productImagePool[key];
  if (pool != null && pool.isNotEmpty) {
    return pool[_hashId(productId) % pool.length];
  }
  return categoryImages[key] ?? storefrontImage;
}

List<String> productGalleryUrls({required String productId, String? categoryId, int count = 5}) {
  final key = resolveCategoryImageKey(categoryId);
  final pool = productImagePool[key] ?? [categoryImages[key] ?? storefrontImage];
  final start = _hashId(productId) % pool.length;
  return List.generate(count, (i) => pool[(start + i) % pool.length]);
}

String storeCoverUrl({required String storeId, String? mainCategory}) {
  final key = resolveCategoryImageKey(mainCategory);
  final pool = storeCoverPool[key];
  if (pool != null && pool.isNotEmpty) {
    return pool[_hashId(storeId) % pool.length];
  }
  return categoryImages[key] ?? storefrontImage;
}

List<String> storePhotoUrls({required String storeId, String? mainCategory}) {
  final key = resolveCategoryImageKey(mainCategory);
  final cover = storeCoverUrl(storeId: storeId, mainCategory: mainCategory);
  final pool = productImagePool[key] ?? [storeInteriorImage];
  final alt = pool[_hashId('$storeId-alt') % pool.length];
  final third = pool[_hashId('$storeId-3') % pool.length];
  return [cover, storeInteriorImage, alt, third];
}

ProductModel enrichProduct(ProductModel product) {
  if (product.imageUrl != null && product.imageUrl!.isNotEmpty) return product;
  return ProductModel(
    id: product.id,
    name: product.name,
    storeId: product.storeId,
    price: product.price,
    description: product.description,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    imageUrl: productImageUrl(productId: product.id, categoryId: product.categoryId),
    currency: product.currency,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    isActive: product.isActive,
  );
}

StoreModel enrichStore(StoreModel store) {
  if (store.photos.isNotEmpty || (store.logoUrl != null && store.logoUrl!.isNotEmpty)) {
    return store;
  }
  final photos = storePhotoUrls(storeId: store.id, mainCategory: store.mainCategory);
  return store.copyWith(
    logoUrl: photos.first,
    photos: photos,
  );
}

String imageForCartItem({required String productId, String? categoryId}) {
  return productImageUrl(productId: productId, categoryId: categoryId);
}

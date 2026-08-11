import '../../config/api_config.dart';
import '../models/product.dart';
import 'api_client.dart';

class CatalogService {
  CatalogService(this._client);

  final ApiClient _client;

  Future<ProductListResponse> getProducts({
    String? storeId,
    String? search,
    double? minPrice,
    double? maxPrice,
    bool? inStock,
    int page = 1,
    int limit = 40,
  }) async {
    final response = await _client.dio.get(
      '${ApiConfig.catalogPath}/products',
      queryParameters: {
        if (storeId != null) 'storeId': storeId,
        if (search != null && search.isNotEmpty) 'search': search,
        if (minPrice != null) 'minPrice': minPrice,
        if (maxPrice != null) 'maxPrice': maxPrice,
        if (inStock == true) 'inStock': true,
        'page': page,
        'limit': limit,
      },
    );
    return ProductListResponse.fromJson(response.data);
  }

  Future<ProductModel> getProduct(String id) async {
    final response = await _client.dio.get(
      '${ApiConfig.catalogPath}/products/$id',
    );
    return ProductModel.fromJson(response.data as Map<String, dynamic>);
  }
}

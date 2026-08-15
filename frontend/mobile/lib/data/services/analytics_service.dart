import '../../config/api_config.dart';
import 'api_client.dart';

class AnalyticsService {
  AnalyticsService(this._client);

  final ApiClient _client;

  Future<Map<String, dynamic>> getOverview() async {
    final response = await _client.dio.get('${ApiConfig.analyticsPath}/overview');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getMonitoring() async {
    final response = await _client.dio.get('${ApiConfig.analyticsPath}/monitoring');
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getDashboard({String? storeId}) async {
    final response = await _client.dio.get(
      '${ApiConfig.analyticsPath}/dashboard',
      queryParameters: {if (storeId != null) 'storeId': storeId},
    );
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getProfit({String? storeId}) async {
    final response = await _client.dio.get(
      '${ApiConfig.analyticsPath}/profit',
      queryParameters: {if (storeId != null) 'storeId': storeId},
    );
    return response.data as Map<String, dynamic>;
  }
}

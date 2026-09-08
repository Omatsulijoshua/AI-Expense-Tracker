import 'package:dio/dio.dart';
import '../storage/secure_storage_service.dart';

class ApiClient {
  late final Dio _dio;
  final SecureStorageService _storageService;

  ApiClient(this._storageService, {String? baseUrl}) {
    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl ?? 'http://localhost:3000/api/v1',
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storageService.getAccessToken();
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            final refreshToken = await _storageService.getRefreshToken();
            if (refreshToken != null) {
              try {
                final refreshResponse = await _dio.post(
                  '/auth/refresh',
                  data: {'refreshToken': refreshToken},
                );

                final newAccessToken = refreshResponse.data['accessToken'];
                final newRefreshToken = refreshResponse.data['refreshToken'];

                await _storageService.saveAccessToken(newAccessToken);
                await _storageService.saveRefreshToken(newRefreshToken);

                // Retry original request with new token
                final opts = error.requestOptions;
                opts.headers['Authorization'] = 'Bearer $newAccessToken';

                final cloneReq = await _dio.request(
                  opts.path,
                  options: Options(
                    method: opts.method,
                    headers: opts.headers,
                  ),
                  data: opts.data,
                  queryParameters: opts.queryParameters,
                );

                return handler.resolve(cloneReq);
              } catch (_) {
                await _storageService.clearTokens();
              }
            }
          }
          return handler.next(error);
        },
      ),
    );
  }

  Dio get client => _dio;
}

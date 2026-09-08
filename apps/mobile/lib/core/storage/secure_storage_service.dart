import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorageService {
  final FlutterSecureStorage _storage;

  SecureStorageService() : _storage = const FlutterSecureStorage();

  static const String keyAccessToken = 'jwt_access_token';
  static const String keyRefreshToken = 'jwt_refresh_token';
  static const String keyUserData = 'user_data_json';

  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: keyAccessToken, value: token);
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: keyAccessToken);
  }

  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: keyRefreshToken, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _storage.read(key: keyRefreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: keyAccessToken);
    await _storage.delete(key: keyRefreshToken);
    await _storage.delete(key: keyUserData);
  }
}

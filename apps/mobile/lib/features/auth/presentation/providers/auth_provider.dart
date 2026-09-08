import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/user_model.dart';

final secureStorageProvider = Provider<SecureStorageService>((ref) {
  return SecureStorageService();
});

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(secureStorageProvider);
  return ApiClient(storage);
});

final authNotifierProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthNotifier(apiClient, storage);
});

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _apiClient;
  final SecureStorageService _storage;

  AuthNotifier(this._apiClient, this._storage) : super(AuthState.initial()) {
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    final token = await _storage.getAccessToken();
    if (token == null || token.isEmpty) {
      state = AuthState.unauthenticated();
      return;
    }

    try {
      final response = await _apiClient.client.get('/users/me');
      final user = UserModel.fromJson(response.data);
      state = AuthState.authenticated(user);
    } catch (_) {
      state = AuthState.unauthenticated();
    }
  }

  Future<bool> login(String email, String password) async {
    state = AuthState.loading();
    try {
      final response = await _apiClient.client.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      final accessToken = response.data['accessToken'] as String;
      final refreshToken = response.data['refreshToken'] as String;
      final user = UserModel.fromJson(response.data['user']);

      await _storage.saveAccessToken(accessToken);
      await _storage.saveRefreshToken(refreshToken);

      state = AuthState.authenticated(user);
      return true;
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Login failed. Please check credentials.';
      state = AuthState.error(msg.toString());
      return false;
    } catch (e) {
      state = AuthState.error('An unexpected error occurred.');
      return false;
    }
  }

  Future<bool> register(String name, String email, String password, String currency) async {
    state = AuthState.loading();
    try {
      final response = await _apiClient.client.post(
        '/auth/register',
        data: {
          'name': name,
          'email': email,
          'password': password,
          'currency': currency,
        },
      );

      final accessToken = response.data['accessToken'] as String;
      final refreshToken = response.data['refreshToken'] as String;
      final user = UserModel.fromJson(response.data['user']);

      await _storage.saveAccessToken(accessToken);
      await _storage.saveRefreshToken(refreshToken);

      state = AuthState.authenticated(user);
      return true;
    } on DioException catch (e) {
      final msg = e.response?.data['message'] ?? 'Registration failed.';
      state = AuthState.error(msg.toString());
      return false;
    } catch (e) {
      state = AuthState.error('An unexpected error occurred.');
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.client.post('/auth/logout');
    } catch (_) {}
    await _storage.clearTokens();
    state = AuthState.unauthenticated();
  }
}

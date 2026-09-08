import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../domain/account_model.dart';
import '../../domain/transaction_model.dart';

final accountsOverviewProvider = FutureProvider.autoDispose<AccountsOverview>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/accounts');
  return AccountsOverview.fromJson(response.data);
});

final categoriesProvider = FutureProvider.autoDispose<List<CategoryModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/categories');
  final rawList = response.data as List? ?? [];
  return rawList.map((e) => CategoryModel.fromJson(e)).toList();
});

final timelineProvider = FutureProvider.autoDispose<List<TransactionModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/transactions/timeline');
  final rawList = response.data['data'] as List? ?? [];
  return rawList.map((e) => TransactionModel.fromJson(e)).toList();
});

class FinancialActionNotifier extends StateNotifier<AsyncValue<void>> {
  final ApiClient _apiClient;
  final Ref _ref;

  FinancialActionNotifier(this._apiClient, this._ref) : super(const AsyncValue.data(null));

  Future<bool> createAccount(String name, String type, String institution, double openingBalance) async {
    state = const AsyncValue.loading();
    try {
      await _apiClient.client.post('/accounts', data: {
        'name': name,
        'type': type,
        'institution': institution,
        'openingBalance': openingBalance,
      });
      _ref.invalidate(accountsOverviewProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> createTransaction({
    required String accountId,
    required String type,
    required double amount,
    String? categoryId,
    String? merchant,
    String? description,
  }) async {
    state = const AsyncValue.loading();
    try {
      await _apiClient.client.post('/transactions', data: {
        'accountId': accountId,
        'type': type,
        'amount': amount,
        'categoryId': categoryId,
        'merchant': merchant,
        'description': description,
      });
      _ref.invalidate(accountsOverviewProvider);
      _ref.invalidate(timelineProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> createTransfer({
    required String sourceAccountId,
    required String destinationAccountId,
    required double amount,
    String? description,
  }) async {
    state = const AsyncValue.loading();
    try {
      await _apiClient.client.post('/transactions/transfer', data: {
        'sourceAccountId': sourceAccountId,
        'destinationAccountId': destinationAccountId,
        'amount': amount,
        'description': description,
      });
      _ref.invalidate(accountsOverviewProvider);
      _ref.invalidate(timelineProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final financialActionProvider = StateNotifierProvider<FinancialActionNotifier, AsyncValue<void>>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return FinancialActionNotifier(apiClient, ref);
});

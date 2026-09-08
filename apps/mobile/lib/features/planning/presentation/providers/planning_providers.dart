import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/network/api_client.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../domain/planning_models.dart';

final budgetsProvider = FutureProvider.autoDispose<List<BudgetModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/budgets');
  final rawList = response.data as List? ?? [];
  return rawList.map((e) => BudgetModel.fromJson(e)).toList();
});

final billsProvider = FutureProvider.autoDispose<List<BillModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/bills');
  final rawList = response.data as List? ?? [];
  return rawList.map((e) => BillModel.fromJson(e)).toList();
});

final goalsProvider = FutureProvider.autoDispose<List<SavingsGoalModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/goals');
  final rawList = response.data as List? ?? [];
  return rawList.map((e) => SavingsGoalModel.fromJson(e)).toList();
});

class PlanningActionNotifier extends StateNotifier<AsyncValue<void>> {
  final ApiClient _apiClient;
  final Ref _ref;

  PlanningActionNotifier(this._apiClient, this._ref) : super(const AsyncValue.data(null));

  Future<bool> createBudget(String name, double totalAmount, List<Map<String, dynamic>> categories) async {
    state = const AsyncValue.loading();
    try {
      final now = DateTime.now();
      final start = DateTime(now.year, now.month, 1).toIso8601String();
      final end = DateTime(now.year, now.month + 1, 0, 23, 59, 59).toIso8601String();

      await _apiClient.client.post('/budgets', data: {
        'name': name,
        'amount': totalAmount,
        'startDate': start,
        'endDate': end,
        'categories': categories,
      });
      _ref.invalidate(budgetsProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> createBill(String name, double amount, DateTime dueDate) async {
    state = const AsyncValue.loading();
    try {
      await _apiClient.client.post('/bills', data: {
        'name': name,
        'amount': amount,
        'dueDate': dueDate.toIso8601String(),
        'frequency': 'MONTHLY',
      });
      _ref.invalidate(billsProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> payBill(String billId, {String? accountId}) async {
    state = const AsyncValue.loading();
    try {
      await _apiClient.client.post('/bills/$billId/pay', data: {
        'accountId': accountId,
      });
      _ref.invalidate(billsProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> createGoal(String name, double targetAmount) async {
    state = const AsyncValue.loading();
    try {
      await _apiClient.client.post('/goals', data: {
        'name': name,
        'targetAmount': targetAmount,
      });
      _ref.invalidate(goalsProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }

  Future<bool> contributeGoal(String goalId, double amount) async {
    state = const AsyncValue.loading();
    try {
      await _apiClient.client.post('/goals/$goalId/contribute', data: {
        'amount': amount,
      });
      _ref.invalidate(goalsProvider);
      state = const AsyncValue.data(null);
      return true;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      return false;
    }
  }
}

final planningActionProvider = StateNotifierProvider<PlanningActionNotifier, AsyncValue<void>>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return PlanningActionNotifier(apiClient, ref);
});

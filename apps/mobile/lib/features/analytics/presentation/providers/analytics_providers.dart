import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../domain/analytics_model.dart';

final selectedPeriodProvider = StateProvider<String>((ref) => 'THIS_MONTH');

final cashFlowReportProvider = FutureProvider.autoDispose<CashFlowReport>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final period = ref.watch(selectedPeriodProvider);
  final response = await apiClient.client.get('/reports/cash-flow', queryParameters: {'period': period});
  return CashFlowReport.fromJson(response.data);
});

final categoryBreakdownProvider = FutureProvider.autoDispose<CategoryBreakdownReport>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final period = ref.watch(selectedPeriodProvider);
  final response = await apiClient.client.get('/reports/category-breakdown', queryParameters: {'period': period, 'type': 'EXPENSE'});
  return CategoryBreakdownReport.fromJson(response.data);
});

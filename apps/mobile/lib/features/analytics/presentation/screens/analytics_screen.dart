import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/analytics_providers.dart';

class AnalyticsScreen extends ConsumerWidget {
  const AnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final period = ref.watch(selectedPeriodProvider);
    final cashFlowAsync = ref.watch(cashFlowReportProvider);
    final categoryAsync = ref.watch(categoryBreakdownProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Financial Analytics'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Period Selector Toggle
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'THIS_MONTH', label: Text('This Month')),
                ButtonSegment(value: 'LAST_MONTH', label: Text('Last Month')),
                ButtonSegment(value: 'THIS_YEAR', label: Text('This Year')),
              ],
              selected: {period},
              onSelectionChanged: (val) {
                ref.read(selectedPeriodProvider.notifier).state = val.first;
              },
            ),
            const SizedBox(height: 20),

            // Cash Flow Summary Card
            cashFlowAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Text('Error loading cash flow: $err'),
              data: (report) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Cash Flow Overview',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildMetricColumn(
                            theme,
                            title: 'Total Inflow',
                            amount: '₦${report.totalInflow.toStringAsFixed(2)}',
                            color: Colors.green,
                          ),
                          _buildMetricColumn(
                            theme,
                            title: 'Total Outflow',
                            amount: '₦${report.totalOutflow.toStringAsFixed(2)}',
                            color: Colors.red,
                          ),
                          _buildMetricColumn(
                            theme,
                            title: 'Net Cash Flow',
                            amount: '₦${report.netCashFlow.toStringAsFixed(2)}',
                            color: report.netCashFlow >= 0 ? Colors.green : Colors.red,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 24),

            Text(
              'Expense Breakdown by Category',
              style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            categoryAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Text('Error loading breakdown: $err'),
              data: (report) {
                if (report.items.isEmpty) {
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Center(
                        child: Text('No spending records for this period.', style: theme.textTheme.bodyMedium),
                      ),
                    ),
                  );
                }

                return Column(
                  children: [
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Total Expense Spent', style: TextStyle(fontWeight: FontWeight.w600)),
                            Text(
                              '₦${report.grandTotal.toStringAsFixed(2)}',
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                                color: Colors.red,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: report.items.length,
                      separatorBuilder: (ctx, i) => const SizedBox(height: 8),
                      itemBuilder: (ctx, i) {
                        final item = report.items[i];
                        return Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(item.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                    Text(
                                      '₦${item.amount.toStringAsFixed(2)} (${item.percentage}%)',
                                      style: const TextStyle(fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                LinearProgressIndicator(
                                  value: item.percentage / 100,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricColumn(ThemeData theme, {required String title, required String amount, required Color color}) {
    return Column(
      children: [
        Text(title, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
        const SizedBox(height: 4),
        Text(
          amount,
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
}

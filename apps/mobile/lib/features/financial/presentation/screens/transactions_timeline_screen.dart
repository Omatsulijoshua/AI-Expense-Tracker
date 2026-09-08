import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/financial_providers.dart';

class TransactionsTimelineScreen extends ConsumerWidget {
  const TransactionsTimelineScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineAsync = ref.watch(timelineProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transaction Timeline'),
      ),
      body: timelineAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error loading transactions: $err')),
        data: (transactions) {
          if (transactions.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.receipt_long_outlined, size: 64, color: theme.colorScheme.onSurfaceVariant),
                  const SizedBox(height: 16),
                  Text('No transactions found in timeline.', style: theme.textTheme.titleMedium),
                ],
              ),
            );
          }

          final dateFormat = DateFormat('MMM dd, yyyy • HH:mm');

          return ListView.separated(
            padding: const EdgeInsets.all(16.0),
            itemCount: transactions.length,
            separatorBuilder: (ctx, i) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final tx = transactions[i];
              final isExpense = tx.type == 'EXPENSE';
              final isIncome = tx.type == 'INCOME';

              final amountPrefix = isExpense ? '-' : (isIncome ? '+' : '');
              final amountColor = isExpense
                  ? Colors.red
                  : (isIncome ? Colors.green : theme.colorScheme.onSurface);

              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: isExpense
                        ? Colors.red.shade100
                        : (isIncome ? Colors.green.shade100 : Colors.blue.shade100),
                    child: Icon(
                      isExpense
                          ? Icons.arrow_upward
                          : (isIncome ? Icons.arrow_downward : Icons.swap_horiz),
                      color: amountColor,
                    ),
                  ),
                  title: Text(
                    tx.merchant ?? tx.categoryName ?? tx.description ?? 'Transaction',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    '${tx.accountName ?? 'Account'} • ${dateFormat.format(tx.transactionDate)}',
                  ),
                  trailing: Text(
                    '$amountPrefix₦${tx.amount.toStringAsFixed(2)}',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: amountColor,
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

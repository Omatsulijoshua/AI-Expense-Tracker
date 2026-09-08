import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../financial/presentation/providers/financial_providers.dart';
import '../../../core/sync/sync_status_badge.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final overviewAsync = ref.watch(accountsOverviewProvider);
    final timelineAsync = ref.watch(timelineProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Expense Tracker'),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: Colors.amber),
            tooltip: 'AI Advisor Chat',
            onPressed: () => context.push('/ai-assistant'),
          ),
          IconButton(
            icon: const Icon(Icons.mic),
            tooltip: 'Voice Entry',
            onPressed: () => context.push('/voice-entry'),
          ),
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            tooltip: 'Scan Receipt',
            onPressed: () => context.push('/receipt-scan'),
          ),
          IconButton(
            icon: const Icon(Icons.hub_outlined),
            tooltip: 'Bank Connections',
            onPressed: () => context.push('/integrations'),
          ),
          IconButton(
            icon: const Icon(Icons.file_upload_outlined),
            tooltip: 'Import CSV',
            onPressed: () => context.push('/import'),
          ),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.push('/search'),
          ),
          IconButton(
            icon: const Icon(Icons.analytics_outlined),
            onPressed: () => context.push('/analytics'),
          ),
          IconButton(
            icon: const Icon(Icons.account_balance_outlined),
            onPressed: () => context.push('/accounts'),
          ),
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () => context.push('/timeline'),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          const SyncStatusBadge(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
            // Net Worth Overview Card
            Card(
              color: theme.colorScheme.primaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Total Net Balance',
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: theme.colorScheme.onPrimaryContainer.withValues(alpha: 0.8),
                      ),
                    ),
                    const SizedBox(height: 8),
                    overviewAsync.when(
                      loading: () => const Text('₦...', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                      error: (e, s) => const Text('₦0.00', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
                      data: (overview) => Text(
                        '₦${overview.netWorth.toStringAsFixed(2)}',
                        style: theme.textTheme.headlineLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.onPrimaryContainer,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _buildBalancePill(
                          theme,
                          label: 'Accounts',
                          amount: overviewAsync.maybeWhen(
                            data: (o) => '${o.count}',
                            orElse: () => '0',
                          ),
                          icon: Icons.account_balance,
                          iconColor: Colors.blue,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Quick Actions',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildActionButton(theme, icon: Icons.add, label: 'Add Entry', onTap: () => context.push('/add-transaction')),
                _buildActionButton(theme, icon: Icons.qr_code_scanner, label: 'Scan Receipt', onTap: () => context.push('/receipt-scan')),
                _buildActionButton(theme, icon: Icons.folder_shared_outlined, label: 'Vault', onTap: () => context.push('/documents')),
                _buildActionButton(theme, icon: Icons.file_upload_outlined, label: 'Import CSV', onTap: () => context.push('/import')),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildActionButton(theme, icon: Icons.pie_chart_outline, label: 'Budgets', onTap: () => context.push('/budgets')),
                _buildActionButton(theme, icon: Icons.receipt_long_outlined, label: 'Bills', onTap: () => context.push('/bills')),
                _buildActionButton(theme, icon: Icons.savings_outlined, label: 'Goals', onTap: () => context.push('/goals')),
                _buildActionButton(theme, icon: Icons.history, label: 'Timeline', onTap: () => context.push('/timeline')),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Activity',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () => context.push('/timeline'),
                  child: const Text('See All'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            timelineAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, s) => Card(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Center(
                    child: Text('No transactions recorded yet.', style: theme.textTheme.bodyMedium),
                  ),
                ),
              ),
              data: (txList) {
                if (txList.isEmpty) {
                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Center(
                        child: Text('No transactions recorded yet.', style: theme.textTheme.bodyMedium),
                      ),
                    ),
                  );
                }

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: txList.take(5).length,
                  separatorBuilder: (ctx, i) => const SizedBox(height: 8),
                  itemBuilder: (ctx, i) {
                    final tx = txList[i];
                    final isExpense = tx.type == 'EXPENSE';
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: isExpense ? Colors.red.shade100 : Colors.green.shade100,
                          child: Icon(
                            isExpense ? Icons.arrow_upward : Icons.arrow_downward,
                            color: isExpense ? Colors.red : Colors.green,
                          ),
                        ),
                        title: Text(tx.merchant ?? tx.description ?? 'Transaction', style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(tx.accountName ?? 'Account'),
                        trailing: Text(
                          '${isExpense ? '-' : '+'}₦${tx.amount.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: isExpense ? Colors.red : Colors.green,
                          ),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    ),
  ],
),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/voice-entry'),
        icon: const Icon(Icons.mic),
        label: const Text('Voice Entry'),
      ),
    );
  }

  Widget _buildBalancePill(
    ThemeData theme, {
    required String label,
    required String amount,
    required IconData icon,
    required Color iconColor,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: iconColor),
          const SizedBox(width: 4),
          Text(
            '$label: $amount',
            style: theme.textTheme.bodySmall?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    ThemeData theme, {
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return Column(
      children: [
        IconButton.filledTonal(
          icon: Icon(icon),
          onPressed: onTap,
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: theme.textTheme.labelSmall,
        ),
      ],
    );
  }
}

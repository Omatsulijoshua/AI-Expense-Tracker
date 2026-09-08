import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/financial_providers.dart';

class AccountsScreen extends ConsumerWidget {
  const AccountsScreen({super.key});

  void _showAddAccountDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final instController = TextEditingController();
    final balanceController = TextEditingController();
    String selectedType = 'BANK_ACCOUNT';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Financial Account'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(labelText: 'Account Name'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: selectedType,
                decoration: const InputDecoration(labelText: 'Account Type'),
                items: const [
                  DropdownMenuItem(value: 'BANK_ACCOUNT', child: Text('Bank Account')),
                  DropdownMenuItem(value: 'CASH_WALLET', child: Text('Cash Wallet')),
                  DropdownMenuItem(value: 'SAVINGS_ACCOUNT', child: Text('Savings Account')),
                  DropdownMenuItem(value: 'CREDIT_CARD', child: Text('Credit Card')),
                  DropdownMenuItem(value: 'INVESTMENT_ACCOUNT', child: Text('Investment')),
                ],
                onChanged: (val) => selectedType = val ?? selectedType,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: instController,
                decoration: const InputDecoration(labelText: 'Institution (e.g. GTBank)'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: balanceController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: const InputDecoration(labelText: 'Opening Balance'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              final name = nameController.text.trim();
              if (name.isNotEmpty) {
                final balance = double.tryParse(balanceController.text.trim()) ?? 0.0;
                final success = await ref.read(financialActionProvider.notifier).createAccount(
                      name,
                      selectedType,
                      instController.text.trim(),
                      balance,
                    );
                if (success && ctx.mounted) {
                  Navigator.pop(ctx);
                }
              }
            },
            child: const Text('Create Account'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final overviewAsync = ref.watch(accountsOverviewProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Financial Accounts'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddAccountDialog(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Add Account'),
      ),
      body: overviewAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error loading accounts: $err')),
        data: (overview) => SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                color: theme.colorScheme.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total Net Worth',
                            style: theme.textTheme.titleSmall?.copyWith(
                              color: theme.colorScheme.onPrimaryContainer.withValues(alpha: 0.8),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '₦${overview.netWorth.toStringAsFixed(2)}',
                            style: theme.textTheme.headlineMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.onPrimaryContainer,
                            ),
                          ),
                        ],
                      ),
                      Chip(
                        label: Text('${overview.count} Accounts'),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Your Accounts',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              if (overview.accounts.isEmpty)
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Center(
                      child: Text(
                        'No financial accounts created yet.',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ),
                  ),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: overview.accounts.length,
                  separatorBuilder: (ctx, i) => const SizedBox(height: 8),
                  itemBuilder: (ctx, i) {
                    final acc = overview.accounts[i];
                    return Card(
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: theme.colorScheme.secondaryContainer,
                          child: Icon(
                            acc.type == 'CASH_WALLET' ? Icons.account_balance_wallet : Icons.account_balance,
                            color: theme.colorScheme.onSecondaryContainer,
                          ),
                        ),
                        title: Text(acc.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text(acc.institution ?? acc.type),
                        trailing: Text(
                          '₦${acc.currentBalance.toStringAsFixed(2)}',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}

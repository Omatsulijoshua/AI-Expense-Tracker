import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/financial_providers.dart';

class AddTransactionScreen extends ConsumerStatefulWidget {
  const AddTransactionScreen({super.key});

  @override
  ConsumerState<AddTransactionScreen> createState() => _AddTransactionScreenState();
}

class _AddTransactionScreenState extends ConsumerState<AddTransactionScreen> {
  final _formKey = GlobalKey<FormState>();
  String _transactionType = 'EXPENSE'; // EXPENSE, INCOME, TRANSFER
  final _amountController = TextEditingController();
  final _merchantController = TextEditingController();
  final _descController = TextEditingController();

  String? _selectedAccountId;
  String? _selectedDestAccountId;
  String? _selectedCategoryId;

  @override
  void dispose() {
    _amountController.dispose();
    _merchantController.dispose();
    _descController.dispose();
    super.dispose();
  }

  void _submit() async {
    if (_formKey.currentState!.validate()) {
      final amount = double.tryParse(_amountController.text.trim()) ?? 0.0;

      if (_transactionType == 'TRANSFER') {
        if (_selectedAccountId == null || _selectedDestAccountId == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please select both source and destination accounts')),
          );
          return;
        }

        final success = await ref.read(financialActionProvider.notifier).createTransfer(
              sourceAccountId: _selectedAccountId!,
              destinationAccountId: _selectedDestAccountId!,
              amount: amount,
              description: _descController.text.trim(),
            );

        if (success && mounted) {
          context.go('/');
        }
      } else {
        if (_selectedAccountId == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please select an account')),
          );
          return;
        }

        final success = await ref.read(financialActionProvider.notifier).createTransaction(
              accountId: _selectedAccountId!,
              type: _transactionType,
              amount: amount,
              categoryId: _selectedCategoryId,
              merchant: _merchantController.text.trim(),
              description: _descController.text.trim(),
            );

        if (success && mounted) {
          context.go('/');
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final accountsAsync = ref.watch(accountsOverviewProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Add Transaction'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Segmented Button for Expense / Income / Transfer
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'EXPENSE', label: Text('Expense'), icon: Icon(Icons.arrow_upward)),
                  ButtonSegment(value: 'INCOME', label: Text('Income'), icon: Icon(Icons.arrow_downward)),
                  ButtonSegment(value: 'TRANSFER', label: Text('Transfer'), icon: Icon(Icons.swap_horiz)),
                ],
                selected: {_transactionType},
                onSelectionChanged: (val) {
                  setState(() => _transactionType = val.first);
                },
              ),
              const SizedBox(height: 24),

              // Amount Input
              TextFormField(
                controller: _amountController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
                decoration: const InputDecoration(
                  labelText: 'Amount',
                  prefixText: '₦ ',
                  border: OutlineInputBorder(),
                ),
                validator: (val) {
                  if (val == null || val.isEmpty || (double.tryParse(val) ?? 0) <= 0) {
                    return 'Please enter a valid amount';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Account Selector
              accountsAsync.when(
                loading: () => const LinearProgressIndicator(),
                error: (e, s) => Text('Error loading accounts: $e'),
                data: (overview) {
                  final accounts = overview.accounts;
                  if (accounts.isEmpty) {
                    return Card(
                      color: theme.colorScheme.errorContainer,
                      child: const Padding(
                        padding: EdgeInsets.all(16.0),
                        child: Text('No financial accounts found. Please add an account first.'),
                      ),
                    );
                  }

                  _selectedAccountId ??= accounts.first.id;

                  if (_transactionType == 'TRANSFER') {
                    _selectedDestAccountId ??= accounts.length > 1 ? accounts[1].id : accounts.first.id;

                    return Column(
                      children: [
                        DropdownButtonFormField<String>(
                          initialValue: _selectedAccountId,
                          decoration: const InputDecoration(
                            labelText: 'From Account (Source)',
                            border: OutlineInputBorder(),
                          ),
                          items: accounts
                              .map((a) => DropdownMenuItem(value: a.id, child: Text('${a.name} (₦${a.currentBalance})')))
                              .toList(),
                          onChanged: (val) => setState(() => _selectedAccountId = val),
                        ),
                        const SizedBox(height: 16),
                        DropdownButtonFormField<String>(
                          initialValue: _selectedDestAccountId,
                          decoration: const InputDecoration(
                            labelText: 'To Account (Destination)',
                            border: OutlineInputBorder(),
                          ),
                          items: accounts
                              .map((a) => DropdownMenuItem(value: a.id, child: Text('${a.name} (₦${a.currentBalance})')))
                              .toList(),
                          onChanged: (val) => setState(() => _selectedDestAccountId = val),
                        ),
                      ],
                    );
                  }

                  return DropdownButtonFormField<String>(
                    initialValue: _selectedAccountId,
                    decoration: const InputDecoration(
                      labelText: 'Account',
                      border: OutlineInputBorder(),
                    ),
                    items: accounts
                        .map((a) => DropdownMenuItem(value: a.id, child: Text('${a.name} (₦${a.currentBalance})')))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedAccountId = val),
                  );
                },
              ),
              const SizedBox(height: 16),

              // Category Selector (Not for transfer)
              if (_transactionType != 'TRANSFER') ...[
                categoriesAsync.when(
                  loading: () => const SizedBox(),
                  error: (e, s) => const SizedBox(),
                  data: (categories) {
                    final filtered = categories.where((c) => c.type == _transactionType).toList();
                    return DropdownButtonFormField<String>(
                      initialValue: _selectedCategoryId,
                      decoration: const InputDecoration(
                        labelText: 'Category',
                        border: OutlineInputBorder(),
                      ),
                      items: filtered
                          .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name)))
                          .toList(),
                      onChanged: (val) => setState(() => _selectedCategoryId = val),
                    );
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _merchantController,
                  decoration: const InputDecoration(
                    labelText: 'Merchant / Recipient (Optional)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Description
              TextFormField(
                controller: _descController,
                decoration: const InputDecoration(
                  labelText: 'Description / Note',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 32),

              // Submit Button
              FilledButton(
                onPressed: _submit,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('Save Transaction'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

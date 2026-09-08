import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../financial/presentation/providers/financial_providers.dart';

class TransactionSearchScreen extends ConsumerStatefulWidget {
  const TransactionSearchScreen({super.key});

  @override
  ConsumerState<TransactionSearchScreen> createState() => _TransactionSearchScreenState();
}

class _TransactionSearchScreenState extends ConsumerState<TransactionSearchScreen> {
  final _searchController = TextEditingController();
  String _selectedType = 'ALL';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final timelineAsync = ref.watch(timelineProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Transactions'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _searchController,
              decoration: InputDecoration(
                labelText: 'Search Merchant or Description',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    setState(() {});
                  },
                ),
                border: const OutlineInputBorder(),
              ),
              onChanged: (val) => setState(() {}),
            ),
            const SizedBox(height: 12),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'ALL', label: Text('All')),
                ButtonSegment(value: 'EXPENSE', label: Text('Expense')),
                ButtonSegment(value: 'INCOME', label: Text('Income')),
                ButtonSegment(value: 'TRANSFER', label: Text('Transfer')),
              ],
              selected: {_selectedType},
              onSelectionChanged: (val) => setState(() => _selectedType = val.first),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: timelineAsync.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, s) => Center(child: Text('Error: $e')),
                data: (transactions) {
                  final query = _searchController.text.trim().toLowerCase();

                  final filtered = transactions.where((tx) {
                    if (_selectedType != 'ALL' && tx.type != _selectedType) {
                      return false;
                    }
                    if (query.isNotEmpty) {
                      final merchantMatch = tx.merchant?.toLowerCase().contains(query) ?? false;
                      final descMatch = tx.description?.toLowerCase().contains(query) ?? false;
                      final catMatch = tx.categoryName?.toLowerCase().contains(query) ?? false;
                      return merchantMatch || descMatch || catMatch;
                    }
                    return true;
                  }).toList();

                  if (filtered.isEmpty) {
                    return Center(
                      child: Text('No transactions match your search filters.', style: theme.textTheme.bodyMedium),
                    );
                  }

                  return ListView.separated(
                    itemCount: filtered.length,
                    separatorBuilder: (ctx, i) => const SizedBox(height: 8),
                    itemBuilder: (ctx, i) {
                      final tx = filtered[i];
                      final isExpense = tx.type == 'EXPENSE';
                      final isIncome = tx.type == 'INCOME';

                      return Card(
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: isExpense
                                ? Colors.red.shade100
                                : (isIncome ? Colors.green.shade100 : Colors.blue.shade100),
                            child: Icon(
                              isExpense ? Icons.arrow_upward : (isIncome ? Icons.arrow_downward : Icons.swap_horiz),
                              color: isExpense ? Colors.red : (isIncome ? Colors.green : Colors.blue),
                            ),
                          ),
                          title: Text(tx.merchant ?? tx.description ?? 'Transaction', style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text('${tx.accountName ?? 'Account'} • ${tx.type}'),
                          trailing: Text(
                            '₦${tx.amount.toStringAsFixed(2)}',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isExpense ? Colors.red : (isIncome ? Colors.green : Colors.blue),
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/planning_providers.dart';
import '../../../financial/presentation/providers/financial_providers.dart';

class BillsScreen extends ConsumerWidget {
  const BillsScreen({super.key});

  void _showAddBillModal(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final amountController = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(days: 7));

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Upcoming Bill'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Bill Name (e.g. Electricity)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Amount (₦)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final name = nameController.text.trim();
              final amount = double.tryParse(amountController.text.trim()) ?? 0.0;
              if (name.isNotEmpty && amount > 0) {
                final success = await ref.read(planningActionProvider.notifier).createBill(name, amount, selectedDate);
                if (success && ctx.mounted) {
                  Navigator.pop(ctx);
                }
              }
            },
            child: const Text('Save Bill'),
          ),
        ],
      ),
    );
  }

  void _payBill(BuildContext context, WidgetRef ref, String billId) {
    final accounts = ref.read(accountsOverviewProvider).value?.accounts ?? [];
    String? selectedAccId = accounts.isNotEmpty ? accounts.first.id : null;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Pay Bill'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Select an account to deduct payment and record as expense:'),
            const SizedBox(height: 12),
            if (accounts.isNotEmpty)
              DropdownButtonFormField<String>(
                initialValue: selectedAccId,
                items: accounts.map((a) => DropdownMenuItem(value: a.id, child: Text(a.name))).toList(),
                onChanged: (val) => selectedAccId = val,
              ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final success = await ref.read(planningActionProvider.notifier).payBill(billId, accountId: selectedAccId);
              if (success && ctx.mounted) {
                Navigator.pop(ctx);
              }
            },
            child: const Text('Confirm Payment'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final billsAsync = ref.watch(billsProvider);
    final theme = Theme.of(context);
    final dateFormat = DateFormat('MMM dd, yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bill Calendar'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddBillModal(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Add Bill'),
      ),
      body: billsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (bills) {
          if (bills.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Text('No upcoming bills recorded.', style: theme.textTheme.bodyMedium),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16.0),
            itemCount: bills.length,
            separatorBuilder: (ctx, i) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final bill = bills[i];
              final isPaid = bill.status == 'PAID';
              final isOverdue = bill.status == 'OVERDUE';

              return Card(
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: isPaid
                        ? Colors.green.shade100
                        : (isOverdue ? Colors.red.shade100 : Colors.orange.shade100),
                    child: Icon(
                      isPaid ? Icons.check : (isOverdue ? Icons.priority_high : Icons.calendar_month),
                      color: isPaid ? Colors.green : (isOverdue ? Colors.red : Colors.orange),
                    ),
                  ),
                  title: Text(bill.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Text('Due: ${dateFormat.format(bill.dueDate)} • ${bill.frequency}'),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '₦${bill.amount.toStringAsFixed(2)}',
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(width: 8),
                      if (!isPaid)
                        IconButton(
                          icon: const Icon(Icons.payment, color: Colors.blue),
                          onPressed: () => _payBill(context, ref, bill.id),
                        ),
                    ],
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

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/planning_providers.dart';
import '../../../financial/presentation/providers/financial_providers.dart';

class BudgetsScreen extends ConsumerWidget {
  const BudgetsScreen({super.key});

  void _showAddBudgetModal(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final amountController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Create Monthly Budget'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Budget Name (e.g. Household)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Total Target Limit (₦)'),
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
                final categories = ref.read(categoriesProvider).value ?? [];
                final allocations = categories
                    .take(3)
                    .map((c) => {'categoryId': c.id, 'allocated': (amount / 3).roundToDouble()})
                    .toList();

                final success = await ref.read(planningActionProvider.notifier).createBudget(name, amount, allocations);
                if (success && ctx.mounted) {
                  Navigator.pop(ctx);
                }
              }
            },
            child: const Text('Create Budget'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final budgetsAsync = ref.watch(budgetsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Budgets & Adherence'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddBudgetModal(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('Create Budget'),
      ),
      body: budgetsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (budgets) {
          if (budgets.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Text('No active budgets found. Create one to start tracking limits!', style: theme.textTheme.bodyMedium),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16.0),
            itemCount: budgets.length,
            separatorBuilder: (ctx, i) => const SizedBox(height: 16),
            itemBuilder: (ctx, i) {
              final budget = budgets[i];
              final isHighRisk = budget.overallPercentage >= 90;

              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(budget.name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          Chip(
                            avatar: Icon(
                              isHighRisk ? Icons.warning : Icons.check_circle,
                              color: isHighRisk ? Colors.red : Colors.green,
                              size: 16,
                            ),
                            label: Text('${budget.overallPercentage}% Spent'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Spent: ₦${budget.totalSpent.toStringAsFixed(2)} / ₦${budget.totalAllocated.toStringAsFixed(2)}'),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: (budget.overallPercentage / 100).clamp(0.0, 1.0),
                        color: isHighRisk ? Colors.red : theme.colorScheme.primary,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      const SizedBox(height: 16),
                      Text('Category Progress:', style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      ...budget.categoryAllocations.map((cat) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4.0),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(cat.categoryName),
                              Text('₦${cat.spent} / ₦${cat.allocated} (${cat.percentage}%)'),
                            ],
                          ),
                        );
                      }),
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

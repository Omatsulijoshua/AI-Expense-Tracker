import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/planning_providers.dart';

class GoalsScreen extends ConsumerWidget {
  const GoalsScreen({super.key});

  void _showAddGoalModal(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final targetController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('New Savings Goal'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Goal Name (e.g. Laptop)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: targetController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Target Amount (₦)'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final name = nameController.text.trim();
              final target = double.tryParse(targetController.text.trim()) ?? 0.0;
              if (name.isNotEmpty && target > 0) {
                final success = await ref.read(planningActionProvider.notifier).createGoal(name, target);
                if (success && ctx.mounted) {
                  Navigator.pop(ctx);
                }
              }
            },
            child: const Text('Create Goal'),
          ),
        ],
      ),
    );
  }

  void _showContributeModal(BuildContext context, WidgetRef ref, String goalId) {
    final amountController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Contribution'),
        content: TextField(
          controller: amountController,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(labelText: 'Contribution Amount (₦)'),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          FilledButton(
            onPressed: () async {
              final amount = double.tryParse(amountController.text.trim()) ?? 0.0;
              if (amount > 0) {
                final success = await ref.read(planningActionProvider.notifier).contributeGoal(goalId, amount);
                if (success && ctx.mounted) {
                  Navigator.pop(ctx);
                }
              }
            },
            child: const Text('Contribute'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goalsAsync = ref.watch(goalsProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Savings Goals'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddGoalModal(context, ref),
        icon: const Icon(Icons.add),
        label: const Text('New Goal'),
      ),
      body: goalsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
        data: (goals) {
          if (goals.isEmpty) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Text('No savings goals created yet. Set a target to start saving!', style: theme.textTheme.bodyMedium),
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.all(16.0),
            itemCount: goals.length,
            separatorBuilder: (ctx, i) => const SizedBox(height: 12),
            itemBuilder: (ctx, i) {
              final goal = goals[i];

              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(goal.name, style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          Chip(
                            avatar: Icon(
                              goal.isCompleted ? Icons.emoji_events : Icons.savings,
                              color: goal.isCompleted ? Colors.amber : theme.colorScheme.primary,
                              size: 16,
                            ),
                            label: Text('${goal.percentage}%'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text('Saved: ₦${goal.currentAmount.toStringAsFixed(2)} / ₦${goal.targetAmount.toStringAsFixed(2)}'),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: (goal.percentage / 100).clamp(0.0, 1.0),
                        color: goal.isCompleted ? Colors.amber : theme.colorScheme.primary,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      const SizedBox(height: 16),
                      Align(
                        alignment: Alignment.centerRight,
                        child: OutlinedButton.icon(
                          onPressed: () => _showContributeModal(context, ref, goal.id),
                          icon: const Icon(Icons.add),
                          label: const Text('Add Money'),
                        ),
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

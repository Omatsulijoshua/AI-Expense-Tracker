import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../core/sync/sync_status_badge.dart';

final debtsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/debts');
  return Map<String, dynamic>.from(response.data);
});

class DebtsScreen extends ConsumerStatefulWidget {
  const DebtsScreen({super.key});

  @override
  ConsumerState<DebtsScreen> createState() => _DebtsScreenState();
}

class _DebtsScreenState extends ConsumerState<DebtsScreen> {
  Future<void> _showAddDebtDialog() async {
    final personCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    String type = 'I_OWE';

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Debt Record'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            DropdownButtonFormField<String>(
              initialValue: type,
              decoration: const InputDecoration(labelText: 'Debt Type', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'I_OWE', child: Text('I Owe (Liability)')),
                DropdownMenuItem(value: 'OWED_TO_ME', child: Text('Owed to Me (Asset)')),
              ],
              onChanged: (val) {
                if (val != null) type = val;
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: personCtrl,
              decoration: const InputDecoration(labelText: 'Person / Entity Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Total Amount', border: OutlineInputBorder()),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final amt = double.tryParse(amountCtrl.text);
              if (personCtrl.text.isNotEmpty && amt != null && amt > 0) {
                final apiClient = ref.read(apiClientProvider);
                await apiClient.client.post('/debts', data: {
                  'person': personCtrl.text,
                  'type': type,
                  'amount': amt,
                });
                ref.invalidate(debtsProvider);
                if (context.mounted) Navigator.pop(context);
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _showRecordPaymentDialog(String debtId, double currentRemaining) async {
    final amountCtrl = TextEditingController();

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Record Repayment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Remaining Balance: ₦${currentRemaining.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Repayment Amount', border: OutlineInputBorder()),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              final amt = double.tryParse(amountCtrl.text);
              if (amt != null && amt > 0 && amt <= currentRemaining) {
                final apiClient = ref.read(apiClientProvider);
                await apiClient.client.post('/debts/$debtId/payment', data: {
                  'amount': amt,
                });
                ref.invalidate(debtsProvider);
                if (context.mounted) Navigator.pop(context);
              }
            },
            child: const Text('Submit Payment'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final debtsAsync = ref.watch(debtsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Debt & Loan Tracker'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddDebtDialog,
        icon: const Icon(Icons.add),
        label: const Text('Add Debt'),
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
                  debtsAsync.when(
                    data: (data) {
                      final summary = data['summary'] ?? {};
                      final totalIOwe = (summary['totalIOwe'] as num? ?? 0).toDouble();
                      final totalOwedToMe = (summary['totalOwedToMe'] as num? ?? 0).toDouble();
                      final debts = (data['debts'] as List? ?? []);

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Card(
                                  color: Colors.red.shade50,
                                  child: Padding(
                                    padding: const EdgeInsets.all(16.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('I Owe (Liabilities)', style: TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 6),
                                        Text('₦${totalIOwe.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.red)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Card(
                                  color: Colors.green.shade50,
                                  child: Padding(
                                    padding: const EdgeInsets.all(16.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Text('Owed to Me (Assets)', style: TextStyle(fontSize: 12, color: Colors.green, fontWeight: FontWeight.bold)),
                                        const SizedBox(height: 6),
                                        Text('₦${totalOwedToMe.toStringAsFixed(2)}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green)),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),
                          Text('Active Debt Records', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          if (debts.isEmpty)
                            const Card(
                              child: Padding(
                                padding: EdgeInsets.all(24.0),
                                child: Center(child: Text('No debts or loan records currently tracked.')),
                              ),
                            )
                          else
                            ListView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: debts.length,
                              itemBuilder: (context, idx) {
                                final debt = debts[idx];
                                final isIOwe = debt['type'] == 'I_OWE';
                                final originalAmt = (debt['amount'] as num? ?? 0).toDouble();
                                final remaining = (debt['remaining'] as num? ?? 0).toDouble();
                                final paidAmt = originalAmt - remaining;
                                final progress = originalAmt > 0 ? (paidAmt / originalAmt) : 1.0;

                                return Card(
                                  margin: const EdgeInsets.only(bottom: 12),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16.0),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Row(
                                              children: [
                                                Chip(
                                                  label: Text(isIOwe ? 'I OWE' : 'OWED TO ME', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                                  backgroundColor: isIOwe ? Colors.red.shade100 : Colors.green.shade100,
                                                ),
                                                const SizedBox(width: 8),
                                                Text(debt['person'] ?? 'Person', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                              ],
                                            ),
                                            if (remaining > 0)
                                              TextButton.icon(
                                                icon: const Icon(Icons.payment, size: 16),
                                                label: const Text('Pay'),
                                                onPressed: () => _showRecordPaymentDialog(debt['id'], remaining),
                                              ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text('Remaining: ₦${remaining.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                            Text('Original: ₦${originalAmt.toStringAsFixed(2)}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        LinearProgressIndicator(
                                          value: progress,
                                          color: isIOwe ? Colors.red : Colors.green,
                                          backgroundColor: Colors.grey.shade200,
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
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, _) => Text('Error: $err'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

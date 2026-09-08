import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../financial/presentation/providers/financial_providers.dart';
import '../../../../core/sync/sync_status_badge.dart';

final bankConnectionsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/integrations/connections');
  return response.data as List? ?? [];
});

class BankConnectionsScreen extends ConsumerStatefulWidget {
  const BankConnectionsScreen({super.key});

  @override
  ConsumerState<BankConnectionsScreen> createState() => _BankConnectionsScreenState();
}

class _BankConnectionsScreenState extends ConsumerState<BankConnectionsScreen> {
  bool _isLoading = false;

  Future<void> _handleConnectBank() async {
    setState(() => _isLoading = true);

    try {
      final apiClient = ref.read(apiClientProvider);
      final tokenResponse = await apiClient.client.get('/integrations/connect-token');
      final connectUrl = tokenResponse.data['connectUrl'] ?? '';

      if (!mounted) return;

      // Show mock bank auth modal
      final bool? proceed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Link Bank Account'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Connecting via Mono Banking Sandbox...'),
              const SizedBox(height: 12),
              Text(
                'Connect URL:\n$connectUrl',
                style: const TextStyle(fontSize: 11, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              const Text('Click "Authenticate" to simulate user entering internet banking credentials.'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Authenticate & Link'),
            ),
          ],
        ),
      );

      if (proceed == true) {
        final mockPublicToken = 'public_mono_sandbox_${DateTime.now().millisecondsSinceEpoch}';
        final exchResponse = await apiClient.client.post('/integrations/exchange-token', data: {
          'publicToken': mockPublicToken,
        });

        ref.invalidate(bankConnectionsProvider);
        ref.invalidate(accountsOverviewProvider);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(exchResponse.data['message'] ?? 'Bank account linked successfully!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to link bank: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSyncConnection(String connectionId) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      final res = await apiClient.client.post('/integrations/sync/$connectionId');

      ref.invalidate(bankConnectionsProvider);
      ref.invalidate(accountsOverviewProvider);
      ref.invalidate(timelineProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(res.data['message'] ?? 'Connection synced'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sync failed: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final connectionsAsync = ref.watch(bankConnectionsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Connected Financial APIs'),
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
                  Card(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          Icon(
                            Icons.account_balance,
                            size: 36,
                            color: Theme.of(context).colorScheme.onPrimaryContainer,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Automatic Bank Sync',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Connect financial accounts via Mono, Plaid, or Sandbox adapters for automatic transactions.',
                                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                        color: Theme.of(context).colorScheme.onPrimaryContainer.withValues(alpha: 0.8),
                                      ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _isLoading ? null : _handleConnectBank,
                      icon: _isLoading
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.add_link),
                      label: const Text('Connect New Financial Institution'),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Active Linked Institutions',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  connectionsAsync.when(
                    data: (connections) {
                      if (connections.isEmpty) {
                        return const Card(
                          child: Padding(
                            padding: EdgeInsets.all(24.0),
                            child: Center(
                              child: Text('No bank institutions connected yet.'),
                            ),
                          ),
                        );
                      }
                      return ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: connections.length,
                        itemBuilder: (context, idx) {
                          final conn = connections[idx];
                          final accounts = (conn['accounts'] as List? ?? []);

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
                                          const Icon(Icons.verified_user, color: Colors.green, size: 20),
                                          const SizedBox(width: 8),
                                          Text(
                                            conn['institutionName'] ?? 'Linked Bank',
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                          ),
                                        ],
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.sync),
                                        tooltip: 'Sync Now',
                                        onPressed: () => _handleSyncConnection(conn['connectionId']),
                                      ),
                                    ],
                                  ),
                                  const Divider(),
                                  Text(
                                    'Linked Accounts (${accounts.length}):',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 6),
                                  ...accounts.map(
                                    (acc) => Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 2.0),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(acc['name'] ?? 'Account', style: const TextStyle(fontSize: 13)),
                                          Text(
                                            '${acc['currency']} ${acc['currentBalance']}',
                                            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, _) => Text('Error loading connections: $err'),
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

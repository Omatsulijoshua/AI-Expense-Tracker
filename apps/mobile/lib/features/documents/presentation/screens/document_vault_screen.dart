import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../core/sync/sync_status_badge.dart';

final documentsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/documents');
  return response.data as List? ?? [];
});

class DocumentVaultScreen extends ConsumerWidget {
  const DocumentVaultScreen({super.key});

  Future<void> _handleDeleteDoc(BuildContext context, WidgetRef ref, String docId) async {
    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.client.delete('/documents/$docId');
      ref.invalidate(documentsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Document deleted'), backgroundColor: Colors.orange),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete document: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final docsAsync = ref.watch(documentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Receipt & Document Vault'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/receipt-scan'),
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('Scan Receipt'),
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
                          Icon(Icons.folder_shared, size: 36, color: Theme.of(context).colorScheme.onPrimaryContainer),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Financial Document Vault',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Secure repository of all scanned receipts, tax invoices, and financial attachments.',
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
                  const SizedBox(height: 24),
                  Text(
                    'Stored Receipts & Documents',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  docsAsync.when(
                    data: (docs) {
                      if (docs.isEmpty) {
                        return const Card(
                          child: Padding(
                            padding: EdgeInsets.all(24.0),
                            child: Center(
                              child: Text('No documents uploaded yet. Tap "Scan Receipt" to begin.'),
                            ),
                          ),
                        );
                      }

                      return ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: docs.length,
                        itemBuilder: (context, idx) {
                          final doc = docs[idx];
                          final extractions = doc['extractions'] as List? ?? [];
                          final hasExt = extractions.isNotEmpty;

                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: Theme.of(context).colorScheme.secondaryContainer,
                                child: const Icon(Icons.receipt),
                              ),
                              title: Text(doc['filename'] ?? 'Receipt File', style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text(
                                hasExt
                                    ? 'Extracted (Confidence: ${(extractions[0]['confidence'] * 100).toStringAsFixed(0)}%)'
                                    : 'Uploaded ${doc['createdAt'].toString().split('T')[0]}',
                                style: TextStyle(
                                  color: hasExt ? Colors.green.shade800 : Colors.grey.shade700,
                                  fontSize: 12,
                                ),
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.red),
                                onPressed: () => _handleDeleteDoc(context, ref, doc['id']),
                              ),
                            ),
                          );
                        },
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, _) => Text('Error loading documents: $err'),
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

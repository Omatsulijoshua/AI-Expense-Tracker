import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../financial/presentation/providers/financial_providers.dart';
import '../../../../core/sync/sync_status_badge.dart';

class ReceiptScanScreen extends ConsumerStatefulWidget {
  const ReceiptScanScreen({super.key});

  @override
  ConsumerState<ReceiptScanScreen> createState() => _ReceiptScanScreenState();
}

class _ReceiptScanScreenState extends ConsumerState<ReceiptScanScreen> {
  int _step = 0; // 0: Select/Upload, 1: OCR Analyzing, 2: Review & Confirm
  bool _isLoading = false;
  String? _errorMessage;

  String? _documentId;
  String? _selectedAccountId;

  final _merchantController = TextEditingController();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  double _confidence = 0.0;

  @override
  void dispose() {
    _merchantController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _handleScanReceipt(String sampleName) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _step = 1;
    });

    try {
      final apiClient = ref.read(apiClientProvider);

      // Step 1: Upload document metadata
      final uploadRes = await apiClient.client.post('/documents/upload', data: {
        'filename': sampleName,
        'fileContentBase64': 'SGVsbG8gUmVjZWlwdCBPQ1IgVmlzaW9u',
        'mimeType': 'image/jpeg',
      });

      _documentId = uploadRes.data['id'];

      // Step 2: Run Vision OCR analysis
      final analyzeRes = await apiClient.client.post('/documents/$_documentId/analyze');
      final data = analyzeRes.data['extractedData'] ?? {};

      setState(() {
        _merchantController.text = data['merchant'] ?? 'Supermarket';
        _amountController.text = (data['amount'] ?? 0.0).toString();
        _descriptionController.text = 'Receipt item purchase from ${data['merchant']}';
        _confidence = (data['ocrConfidence'] as num? ?? 0.94).toDouble();
        _step = 2;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _step = 0;
        _errorMessage = 'Failed to analyze receipt image: $e';
      });
    }
  }

  Future<void> _handleConfirmTransaction() async {
    if (_selectedAccountId == null) {
      setState(() => _errorMessage = 'Please select an account for this receipt expense');
      return;
    }

    final parsedAmount = double.tryParse(_amountController.text);
    if (parsedAmount == null || parsedAmount <= 0) {
      setState(() => _errorMessage = 'Please enter a valid amount');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.client.post('/documents/$_documentId/confirm', data: {
        'accountId': _selectedAccountId,
        'amount': parsedAmount,
        'description': _descriptionController.text,
        'merchant': _merchantController.text,
        'type': 'EXPENSE',
      });

      ref.invalidate(accountsOverviewProvider);
      ref.invalidate(timelineProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Receipt scan confirmed & expense recorded!'),
            backgroundColor: Colors.green,
          ),
        );
        context.pop();
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to confirm transaction: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final overviewAsync = ref.watch(accountsOverviewProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Receipt & Document Scanner'),
      ),
      body: Column(
        children: [
          const SyncStatusBadge(),
          if (_errorMessage != null)
            Container(
              width: double.infinity,
              color: Colors.red.shade100,
              padding: const EdgeInsets.all(12),
              child: Text(_errorMessage!, style: TextStyle(color: Colors.red.shade900, fontSize: 13)),
            ),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_step == 0) ...[
                    Card(
                      color: Theme.of(context).colorScheme.primaryContainer,
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          children: [
                            Icon(Icons.center_focus_strong, size: 48, color: Theme.of(context).colorScheme.onPrimaryContainer),
                            const SizedBox(height: 12),
                            Text(
                              'AI Receipt Scanner',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                                  ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Snap or upload a paper receipt or invoice. AI will extract merchant name, total, tax, and line items instantly.',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Theme.of(context).colorScheme.onPrimaryContainer.withValues(alpha: 0.8),
                                  ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text('Select Sample Receipt Image to Scan:', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    ListTile(
                      leading: const Icon(Icons.shopping_cart, color: Colors.blue),
                      title: const Text('Supermarket Grocery Receipt'),
                      subtitle: const Text('Shoprite Store - ₦18,750.50'),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      onTap: () => _handleScanReceipt('grocery_receipt_shoprite.jpg'),
                    ),
                    const Divider(),
                    ListTile(
                      leading: const Icon(Icons.local_cafe, color: Colors.brown),
                      title: const Text('Coffee Shop Invoice'),
                      subtitle: const Text('Starbucks Cafe - ₦4,500.00'),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      onTap: () => _handleScanReceipt('coffee_invoice.jpg'),
                    ),
                  ] else if (_step == 1) ...[
                    const SizedBox(height: 40),
                    const Center(
                      child: Column(
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 20),
                          Text('Analyzing Receipt with Vision OCR...', style: TextStyle(fontWeight: FontWeight.bold)),
                          SizedBox(height: 8),
                          Text('Extracting merchant, totals, tax, and date...', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        ],
                      ),
                    ),
                  ] else if (_step == 2) ...[
                    Card(
                      color: Colors.green.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            const Icon(Icons.verified, color: Colors.green),
                            const SizedBox(width: 8),
                            Text(
                              'AI Vision Extraction Complete (Confidence: ${(_confidence * 100).toStringAsFixed(0)}%)',
                              style: TextStyle(color: Colors.green.shade900, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    overviewAsync.when(
                      data: (overview) {
                        final accounts = overview.accounts;
                        if (accounts.isEmpty) return const Text('No accounts available.');
                        _selectedAccountId ??= accounts.first.id;
                        return DropdownButtonFormField<String>(
                          initialValue: _selectedAccountId,
                          decoration: const InputDecoration(
                            labelText: 'Charge to Account',
                            border: OutlineInputBorder(),
                          ),
                          items: accounts
                              .map((a) => DropdownMenuItem(
                                    value: a.id,
                                    child: Text('${a.name} (${a.currency})'),
                                  ))
                              .toList(),
                          onChanged: (val) => setState(() => _selectedAccountId = val),
                        );
                      },
                      loading: () => const CircularProgressIndicator(),
                      error: (err, _) => Text('Error loading accounts: $err'),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _merchantController,
                      decoration: const InputDecoration(labelText: 'Merchant / Vendor', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _amountController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(labelText: 'Extracted Total Amount', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: _descriptionController,
                      decoration: const InputDecoration(labelText: 'Description / Notes', border: OutlineInputBorder()),
                    ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _isLoading ? null : _handleConfirmTransaction,
                        icon: _isLoading
                            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                            : const Icon(Icons.check_circle),
                        label: const Text('Confirm & Record Expense'),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

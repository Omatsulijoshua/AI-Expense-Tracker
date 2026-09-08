import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../financial/presentation/providers/financial_providers.dart';
import '../../../../core/sync/sync_status_badge.dart';

class VoiceEntryScreen extends ConsumerStatefulWidget {
  const VoiceEntryScreen({super.key});

  @override
  ConsumerState<VoiceEntryScreen> createState() => _VoiceEntryScreenState();
}

class _VoiceEntryScreenState extends ConsumerState<VoiceEntryScreen> {
  bool _isRecording = false;
  bool _isLoading = false;
  String? _errorMessage;

  final _transcriptController = TextEditingController();

  Map<String, dynamic>? _extractedIntent;
  double _confidence = 0.0;
  String? _selectedAccountId;

  final List<String> _sampleVoicePrompts = [
    'Spent 12500 Naira on groceries at Shoprite with my Bank Account',
    'Received 150000 Naira freelance payment from Acme Corp',
    'Paid 4500 Naira for coffee at Starbucks',
    'Spent 3500 Naira on Uber ride to airport',
  ];

  @override
  void dispose() {
    _transcriptController.dispose();
    super.dispose();
  }

  Future<void> _handleParseVoice(String text) async {
    setState(() {
      _transcriptController.text = text;
      _isLoading = true;
      _errorMessage = null;
      _extractedIntent = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.client.post('/voice/parse', data: {
        'transcriptText': text,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final intent = response.data['extractedIntent'] ?? {};
        setState(() {
          _extractedIntent = intent;
          _confidence = (response.data['confidence'] as num? ?? 0.96).toDouble();
          _selectedAccountId = intent['matchedAccountId'];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to extract voice intent: $e';
      });
    }
  }

  Future<void> _handleConfirmVoiceTransaction() async {
    if (_extractedIntent == null || _selectedAccountId == null) {
      setState(() => _errorMessage = 'Please select a target account');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      await apiClient.client.post('/voice/confirm', data: {
        'accountId': _selectedAccountId,
        'amount': _extractedIntent!['amount'],
        'description': _transcriptController.text,
        'merchant': _extractedIntent!['merchant'],
        'type': _extractedIntent!['type'],
        'categoryId': _extractedIntent!['matchedCategoryId'],
      });

      ref.invalidate(accountsOverviewProvider);
      ref.invalidate(timelineProvider);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Voice transaction recorded successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        context.pop();
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to confirm voice entry: $e';
      });
    }
  }

  void _toggleMicRecording() {
    if (_isRecording) {
      setState(() => _isRecording = false);
      _handleParseVoice(_transcriptController.text.isEmpty
          ? _sampleVoicePrompts[0]
          : _transcriptController.text);
    } else {
      setState(() {
        _isRecording = true;
        _transcriptController.text = 'Listening... (Speak your transaction)';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final overviewAsync = ref.watch(accountsOverviewProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Voice Assistant Entry'),
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
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  // Animated Mic Button
                  GestureDetector(
                    onTap: _toggleMicRecording,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: _isRecording ? 110 : 90,
                      height: _isRecording ? 110 : 90,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _isRecording ? Colors.red : Theme.of(context).colorScheme.primary,
                        boxShadow: [
                          BoxShadow(
                            color: (_isRecording ? Colors.red : Theme.of(context).colorScheme.primary).withValues(alpha: 0.4),
                            blurRadius: _isRecording ? 20 : 10,
                            spreadRadius: _isRecording ? 6 : 2,
                          ),
                        ],
                      ),
                      child: Icon(
                        _isRecording ? Icons.stop : Icons.mic,
                        color: Colors.white,
                        size: 44,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _isRecording ? 'Tap mic to stop & process' : 'Tap mic and speak your transaction',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 20),

                  // Quick Sample Voice Chips
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Or tap a sample spoken prompt:', style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _sampleVoicePrompts
                        .map(
                          (prompt) => ActionChip(
                            avatar: const Icon(Icons.record_voice_over, size: 16),
                            label: Text(prompt, style: const TextStyle(fontSize: 12)),
                            onPressed: () => _handleParseVoice(prompt),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 20),

                  // Transcript Field
                  TextField(
                    controller: _transcriptController,
                    decoration: InputDecoration(
                      labelText: 'Spoken Voice Transcript',
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.send),
                        onPressed: () {
                          if (_transcriptController.text.isNotEmpty) {
                            _handleParseVoice(_transcriptController.text);
                          }
                        },
                      ),
                    ),
                  ),

                  if (_isLoading) ...[
                    const SizedBox(height: 30),
                    const CircularProgressIndicator(),
                    const SizedBox(height: 12),
                    const Text('Analyzing Voice Intent with Natural Language Engine...'),
                  ],

                  if (_extractedIntent != null && !_isLoading) ...[
                    const SizedBox(height: 24),
                    Card(
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Row(
                                  children: [
                                    Icon(Icons.auto_awesome, color: Colors.purple),
                                    SizedBox(width: 8),
                                    Text('Extracted Intent', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.purple.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '${(_confidence * 100).toStringAsFixed(0)}% Confidence',
                                    style: TextStyle(color: Colors.purple.shade900, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ),
                              ],
                            ),
                            const Divider(height: 20),
                            _buildDetailRow('Type', _extractedIntent!['type'] ?? 'EXPENSE', isBadge: true),
                            _buildDetailRow('Amount', '${_extractedIntent!['currency']} ${_extractedIntent!['amount']}'),
                            _buildDetailRow('Merchant / Payee', _extractedIntent!['merchant'] ?? 'N/A'),
                            _buildDetailRow('Suggested Category', _extractedIntent!['matchedCategoryName'] ?? 'Uncategorized'),
                            const SizedBox(height: 12),

                            // Account selector
                            overviewAsync.when(
                              data: (overview) {
                                final accounts = overview.accounts;
                                if (accounts.isEmpty) return const Text('No accounts available.');
                                _selectedAccountId ??= accounts.first.id;
                                return DropdownButtonFormField<String>(
                                  initialValue: _selectedAccountId,
                                  decoration: const InputDecoration(
                                    labelText: 'Target Account',
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

                            const SizedBox(height: 20),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: _handleConfirmVoiceTransaction,
                                icon: const Icon(Icons.check_circle),
                                label: const Text('Confirm & Record Voice Entry'),
                              ),
                            ),
                          ],
                        ),
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

  Widget _buildDetailRow(String label, String value, {bool isBadge = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          if (isBadge)
            Chip(
              label: Text(value, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              backgroundColor: value == 'INCOME' ? Colors.green.shade100 : Colors.red.shade100,
              labelPadding: const EdgeInsets.symmetric(horizontal: 4),
            )
          else
            Text(value, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        ],
      ),
    );
  }
}

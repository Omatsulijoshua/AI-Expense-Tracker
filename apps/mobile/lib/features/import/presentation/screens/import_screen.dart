import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../financial/presentation/providers/financial_providers.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../core/sync/sync_status_badge.dart';

class ImportScreen extends ConsumerStatefulWidget {
  const ImportScreen({super.key});

  @override
  ConsumerState<ImportScreen> createState() => _ImportScreenState();
}

class _ImportScreenState extends ConsumerState<ImportScreen> {
  int _currentStep = 0;
  bool _isLoading = false;
  String? _errorMessage;

  String? _selectedAccountId;
  final _fileContentController = TextEditingController();

  // Column Mappings
  int _dateCol = 0;
  int _amountCol = 1;
  int _descCol = 2;
  int _categoryCol = 3;
  int _typeCol = 4;

  List<String> _headers = [];
  List<Map<String, dynamic>> _previewRows = [];
  final Set<int> _deselectedIndices = {};

  final String _sampleCsv = '''Date,Amount,Description,Category,Type
2026-03-01,150.00,Supermarket Groceries,Food,EXPENSE
2026-03-02,50.00,Uber Ride to Airport,Transport,EXPENSE
2026-03-03,3500.00,Monthly Consulting Fee,Income,INCOME
2026-03-04,150.00,Supermarket Groceries,Food,EXPENSE''';

  @override
  void initState() {
    super.initState();
    _fileContentController.text = _sampleCsv;
  }

  @override
  void dispose() {
    _fileContentController.dispose();
    super.dispose();
  }

  Future<void> _handleParse() async {
    if (_selectedAccountId == null) {
      setState(() => _errorMessage = 'Please select a target account');
      return;
    }
    if (_fileContentController.text.trim().isEmpty) {
      setState(() => _errorMessage = 'Please enter or paste CSV content');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.client.post('/imports/parse', data: {
        'fileContent': _fileContentController.text,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        final headersList = List<String>.from(data['headers'] ?? []);
        final autoMap = data['autoMapping'] ?? {};

        setState(() {
          _headers = headersList;
          _dateCol = autoMap['dateColumnIndex'] ?? 0;
          _amountCol = autoMap['amountColumnIndex'] ?? 1;
          _descCol = autoMap['descriptionColumnIndex'] ?? 2;
          _categoryCol = autoMap['categoryColumnIndex'] ?? 3;
          _typeCol = autoMap['typeColumnIndex'] ?? 4;
          _currentStep = 1;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to parse CSV format: $e';
      });
    }
  }

  Future<void> _handlePreview() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.client.post('/imports/preview', data: {
        'fileContent': _fileContentController.text,
        'accountId': _selectedAccountId,
        'columnMapping': {
          'dateColumnIndex': _dateCol,
          'amountColumnIndex': _amountCol,
          'descriptionColumnIndex': _descCol,
          'categoryColumnIndex': _categoryCol < _headers.length ? _categoryCol : null,
          'typeColumnIndex': _typeCol < _headers.length ? _typeCol : null,
        },
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = response.data;
        final rowsList = List<Map<String, dynamic>>.from(data['rows'] ?? []);

        setState(() {
          _previewRows = rowsList;
          _deselectedIndices.clear();
          // Auto-deselect duplicates
          for (int i = 0; i < rowsList.length; i++) {
            if (rowsList[i]['isDuplicate'] == true || rowsList[i]['isValid'] == false) {
              _deselectedIndices.add(i);
            }
          }
          _currentStep = 2;
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to preview statement import: $e';
      });
    }
  }

  Future<void> _handleExecute() async {
    final validRowsToImport = <Map<String, dynamic>>[];
    for (int i = 0; i < _previewRows.length; i++) {
      if (!_deselectedIndices.contains(i)) {
        validRowsToImport.add(_previewRows[i]);
      }
    }

    if (validRowsToImport.isEmpty) {
      setState(() => _errorMessage = 'No rows selected for import');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final apiClient = ref.read(apiClientProvider);
      final response = await apiClient.client.post('/imports/execute', data: {
        'accountId': _selectedAccountId,
        'rows': validRowsToImport,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final count = response.data['importedCount'] ?? 0;
        ref.invalidate(accountsOverviewProvider);
        ref.invalidate(timelineProvider);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Successfully imported $count transactions!'),
              backgroundColor: Colors.green,
            ),
          );
          context.pop();
        }
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to execute import: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final overviewAsync = ref.watch(accountsOverviewProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Statement CSV Import'),
      ),
      body: Column(
        children: [
          const SyncStatusBadge(),
          if (_errorMessage != null)
            Container(
              width: double.infinity,
              color: Colors.red.shade100,
              padding: const EdgeInsets.all(12),
              child: Text(
                _errorMessage!,
                style: TextStyle(color: Colors.red.shade900, fontSize: 13),
              ),
            ),
          Expanded(
            child: Stepper(
              currentStep: _currentStep,
              onStepContinue: () {
                if (_currentStep == 0) {
                  _handleParse();
                } else if (_currentStep == 1) {
                  _handlePreview();
                } else if (_currentStep == 2) {
                  _handleExecute();
                }
              },
              onStepCancel: _currentStep > 0
                  ? () => setState(() => _currentStep -= 1)
                  : null,
              controlsBuilder: (context, details) {
                return Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Row(
                    children: [
                      ElevatedButton(
                        onPressed: _isLoading ? null : details.onStepContinue,
                        child: _isLoading
                            ? const SizedBox(
                                height: 18,
                                width: 18,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : Text(_currentStep == 2 ? 'Import Transactions' : 'Next'),
                      ),
                      if (_currentStep > 0) ...[
                        const SizedBox(width: 12),
                        TextButton(
                          onPressed: _isLoading ? null : details.onStepCancel,
                          child: const Text('Back'),
                        ),
                      ],
                    ],
                  ),
                );
              },
              steps: [
                // STEP 1: SELECT ACCOUNT & CSV
                Step(
                  title: const Text('Target Account & Statement'),
                  isActive: _currentStep >= 0,
                  content: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      overviewAsync.when(
                        data: (overview) {
                          final accounts = overview.accounts;
                          if (accounts.isEmpty) {
                            return const Text('No accounts found. Create an account first.');
                          }
                          _selectedAccountId ??= accounts.first.id;
                          return DropdownButtonFormField<String>(
                            initialValue: _selectedAccountId,
                            decoration: const InputDecoration(
                              labelText: 'Target Financial Account',
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
                        error: (err, _) => Text('Error: $err'),
                      ),
                      const SizedBox(height: 16),
                      TextField(
                        controller: _fileContentController,
                        maxLines: 8,
                        decoration: const InputDecoration(
                          labelText: 'Paste Statement CSV Data',
                          hintText: 'Date,Amount,Description...',
                          border: OutlineInputBorder(),
                        ),
                      ),
                    ],
                  ),
                ),

                // STEP 2: COLUMN MAPPING
                Step(
                  title: const Text('Map Columns'),
                  isActive: _currentStep >= 1,
                  content: Column(
                    children: [
                      _buildColumnPicker('Date Column', _dateCol, (v) => setState(() => _dateCol = v)),
                      _buildColumnPicker('Amount Column', _amountCol, (v) => setState(() => _amountCol = v)),
                      _buildColumnPicker('Description Column', _descCol, (v) => setState(() => _descCol = v)),
                      _buildColumnPicker('Category Column', _categoryCol, (v) => setState(() => _categoryCol = v)),
                      _buildColumnPicker('Type Column', _typeCol, (v) => setState(() => _typeCol = v)),
                    ],
                  ),
                ),

                // STEP 3: PREVIEW & DEDUPLICATE
                Step(
                  title: const Text('Preview & Deduplicate'),
                  isActive: _currentStep >= 2,
                  content: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Rows to Import (${_previewRows.length - _deselectedIndices.length} / ${_previewRows.length}):',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _previewRows.length,
                        itemBuilder: (context, idx) {
                          final row = _previewRows[idx];
                          final isDeselected = _deselectedIndices.contains(idx);
                          final isDuplicate = row['isDuplicate'] == true;
                          final isValid = row['isValid'] == true;

                          return CheckboxListTile(
                            value: !isDeselected,
                            onChanged: isValid
                                ? (val) {
                                    setState(() {
                                      if (val == true) {
                                        _deselectedIndices.remove(idx);
                                      } else {
                                        _deselectedIndices.add(idx);
                                      }
                                    });
                                  }
                                : null,
                            title: Text(
                              '${row['description']} (${row['type'] ?? 'EXPENSE'} \$${row['amount']})',
                              style: TextStyle(
                                decoration: isDeselected ? TextDecoration.lineThrough : null,
                              ),
                            ),
                            subtitle: Text(
                              isDuplicate
                                  ? 'DUPLICATE: ${row['duplicateReason']}'
                                  : (!isValid ? 'INVALID: ${row['validationError']}' : 'Date: ${row['transactionDate'].split('T')[0]}'),
                              style: TextStyle(
                                color: isDuplicate || !isValid ? Colors.red : Colors.grey.shade700,
                                fontSize: 12,
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildColumnPicker(String label, int selectedVal, ValueChanged<int> onChanged) {
    if (_headers.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
          DropdownButton<int>(
            value: selectedVal < _headers.length ? selectedVal : 0,
            items: List.generate(
              _headers.length,
              (idx) => DropdownMenuItem(
                value: idx,
                child: Text('Col $idx: ${_headers[idx]}'),
              ),
            ),
            onChanged: (val) {
              if (val != null) onChanged(val);
            },
          ),
        ],
      ),
    );
  }
}

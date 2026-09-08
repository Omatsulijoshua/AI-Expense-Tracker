import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../core/sync/sync_status_badge.dart';

final workspaceMembersProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/workspaces/members');
  return Map<String, dynamic>.from(response.data);
});

class BusinessWorkspaceScreen extends ConsumerStatefulWidget {
  const BusinessWorkspaceScreen({super.key});

  @override
  ConsumerState<BusinessWorkspaceScreen> createState() => _BusinessWorkspaceScreenState();
}

class _BusinessWorkspaceScreenState extends ConsumerState<BusinessWorkspaceScreen> {
  Future<void> _showCreateWorkspaceDialog() async {
    final nameCtrl = TextEditingController();
    String type = 'BUSINESS';

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create New Workspace'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(labelText: 'Workspace Name', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: type,
              decoration: const InputDecoration(labelText: 'Workspace Mode', border: OutlineInputBorder()),
              items: const [
                DropdownMenuItem(value: 'PERSONAL', child: Text('Personal Workspace')),
                DropdownMenuItem(value: 'BUSINESS', child: Text('Business Workspace')),
                DropdownMenuItem(value: 'FAMILY', child: Text('Family Workspace')),
              ],
              onChanged: (val) {
                if (val != null) type = val;
              },
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.isNotEmpty) {
                final apiClient = ref.read(apiClientProvider);
                await apiClient.client.post('/workspaces', data: {
                  'name': nameCtrl.text,
                  'type': type,
                });
                ref.invalidate(workspaceMembersProvider);
                if (context.mounted) Navigator.pop(context);
              }
            },
            child: const Text('Create Workspace'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final membersAsync = ref.watch(workspaceMembersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Business Workspace & Team'),
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
                          Icon(Icons.business_center, size: 36, color: Theme.of(context).colorScheme.onPrimaryContainer),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Shared Workspace Mode',
                                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                                      ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Collaborate with accountants, business partners, or family members with Role-Based Access Control.',
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
                      onPressed: _showCreateWorkspaceDialog,
                      icon: const Icon(Icons.add_business),
                      label: const Text('Create New Business Workspace'),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    'Workspace Members & Roles',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  membersAsync.when(
                    data: (data) {
                      final currentRole = data['currentRole'] ?? 'MEMBER';
                      final members = (data['members'] as List? ?? []);

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Chip(
                            avatar: const Icon(Icons.badge, size: 16),
                            label: Text('Your Role: $currentRole', style: const TextStyle(fontWeight: FontWeight.bold)),
                            backgroundColor: Colors.purple.shade50,
                          ),
                          const SizedBox(height: 12),
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: members.length,
                            itemBuilder: (context, idx) {
                              final member = members[idx];
                              final role = member['role'] ?? 'MEMBER';

                              Color roleColor = Colors.grey;
                              if (role == 'OWNER') {
                                roleColor = Colors.purple;
                              } else if (role == 'ADMIN') {
                                roleColor = Colors.blue;
                              } else if (role == 'ACCOUNTANT') {
                                roleColor = Colors.teal;
                              }

                              return Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    backgroundColor: roleColor.withValues(alpha: 0.2),
                                    child: Icon(Icons.person, color: roleColor),
                                  ),
                                  title: Text(member['name'] ?? 'User', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  subtitle: Text(member['email'] ?? '', style: const TextStyle(fontSize: 12)),
                                  trailing: Chip(
                                    label: Text(role, style: TextStyle(color: roleColor, fontWeight: FontWeight.bold, fontSize: 11)),
                                    backgroundColor: roleColor.withValues(alpha: 0.1),
                                  ),
                                ),
                              );
                            },
                          ),
                        ],
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, _) => Text('Error loading workspace members: $err'),
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

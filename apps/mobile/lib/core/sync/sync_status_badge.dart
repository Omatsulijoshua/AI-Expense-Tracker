import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'sync_queue_service.dart';

class SyncStatusBadge extends ConsumerWidget {
  const SyncStatusBadge({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final syncState = ref.watch(syncQueueProvider);

    if (syncState.isOnline && syncState.pendingCount == 0 && !syncState.isSyncing) {
      return const SizedBox.shrink();
    }

    Color bgColor;
    Color textColor;
    IconData icon;
    String label;

    if (syncState.isSyncing) {
      bgColor = Colors.blue.shade100;
      textColor = Colors.blue.shade900;
      icon = Icons.sync;
      label = 'Syncing ${syncState.pendingCount} offline change(s)...';
    } else if (!syncState.isOnline) {
      bgColor = Colors.amber.shade100;
      textColor = Colors.amber.shade900;
      icon = Icons.wifi_off_rounded;
      label = 'Offline mode (${syncState.pendingCount} pending)';
    } else if (syncState.pendingCount > 0) {
      bgColor = Colors.orange.shade100;
      textColor = Colors.orange.shade900;
      icon = Icons.cloud_upload_outlined;
      label = '${syncState.pendingCount} pending offline change(s)';
    } else {
      return const SizedBox.shrink();
    }

    return GestureDetector(
      onTap: () {
        ref.read(syncQueueProvider.notifier).triggerSync();
      },
      child: Container(
        width: double.infinity,
        color: bgColor,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        child: Row(
          children: [
            Icon(icon, size: 16, color: textColor),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                label,
                style: TextStyle(color: textColor, fontSize: 12, fontWeight: FontWeight.w600),
              ),
            ),
            if (syncState.pendingCount > 0 && !syncState.isSyncing)
              Text(
                'Tap to retry',
                style: TextStyle(color: textColor, fontSize: 11, decoration: TextDecoration.underline),
              ),
          ],
        ),
      ),
    );
  }
}

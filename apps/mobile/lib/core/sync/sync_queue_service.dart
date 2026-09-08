import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage_service.dart';
import '../network/api_client.dart';
import '../../features/auth/presentation/providers/auth_provider.dart';

class SyncItem {
  final String clientTempId;
  final String action; // 'CREATE' | 'DELETE'
  final Map<String, dynamic> data;

  SyncItem({
    required this.clientTempId,
    required this.action,
    required this.data,
  });

  Map<String, dynamic> toJson() => {
        'clientTempId': clientTempId,
        'action': action,
        'data': data,
      };

  factory SyncItem.fromJson(Map<String, dynamic> json) => SyncItem(
        clientTempId: json['clientTempId'] ?? '',
        action: json['action'] ?? 'CREATE',
        data: Map<String, dynamic>.from(json['data'] ?? {}),
      );
}

class SyncState {
  final bool isOnline;
  final bool isSyncing;
  final int pendingCount;
  final String? lastSyncTime;
  final String? syncError;

  SyncState({
    required this.isOnline,
    required this.isSyncing,
    required this.pendingCount,
    this.lastSyncTime,
    this.syncError,
  });

  SyncState copyWith({
    bool? isOnline,
    bool? isSyncing,
    int? pendingCount,
    String? lastSyncTime,
    String? syncError,
  }) {
    return SyncState(
      isOnline: isOnline ?? this.isOnline,
      isSyncing: isSyncing ?? this.isSyncing,
      pendingCount: pendingCount ?? this.pendingCount,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      syncError: syncError ?? this.syncError,
    );
  }
}

class SyncQueueNotifier extends StateNotifier<SyncState> {
  final SecureStorageService _storage;
  final ApiClient _apiClient;
  static const _queueKey = 'offline_sync_queue_v1';

  final List<SyncItem> _queue = [];

  SyncQueueNotifier(this._storage, this._apiClient)
      : super(SyncState(isOnline: true, isSyncing: false, pendingCount: 0)) {
    _loadQueue();
  }

  Future<void> _loadQueue() async {
    final storedStr = await _storage.read(_queueKey);
    if (storedStr != null) {
      try {
        final List<dynamic> jsonList = jsonDecode(storedStr);
        _queue.clear();
        _queue.addAll(jsonList.map((e) => SyncItem.fromJson(Map<String, dynamic>.from(e))));
        state = state.copyWith(pendingCount: _queue.length);
      } catch (_) {}
    }
  }

  Future<void> _saveQueue() async {
    final str = jsonEncode(_queue.map((e) => e.toJson()).toList());
    await _storage.write(_queueKey, str);
    state = state.copyWith(pendingCount: _queue.length);
  }

  Future<void> enqueueAction(String action, Map<String, dynamic> data) async {
    final item = SyncItem(
      clientTempId: 'client_${DateTime.now().millisecondsSinceEpoch}',
      action: action,
      data: data,
    );
    _queue.add(item);
    await _saveQueue();

    if (state.isOnline) {
      await triggerSync();
    }
  }

  void setConnectivity(bool isOnline) {
    state = state.copyWith(isOnline: isOnline);
    if (isOnline && _queue.isNotEmpty) {
      triggerSync();
    }
  }

  Future<void> triggerSync() async {
    if (_queue.isEmpty || state.isSyncing) return;

    state = state.copyWith(isSyncing: true, syncError: null);

    try {
      final itemsPayload = _queue.map((e) => e.toJson()).toList();
      final response = await _apiClient.client.post('/transactions/sync', data: {
        'items': itemsPayload,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        _queue.clear();
        await _saveQueue();
        state = state.copyWith(
          isSyncing: false,
          pendingCount: 0,
          lastSyncTime: DateTime.now().toIso8601String(),
        );
      } else {
        state = state.copyWith(
          isSyncing: false,
          syncError: 'Sync server responded with ${response.statusCode}',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isSyncing: false,
        syncError: 'Network failure during sync',
      );
    }
  }
}

final syncQueueProvider = StateNotifierProvider<SyncQueueNotifier, SyncState>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final apiClient = ref.watch(apiClientProvider);
  return SyncQueueNotifier(storage, apiClient);
});

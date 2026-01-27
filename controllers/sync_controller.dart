
import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import '../services/database_helper.dart';
import '../services/supabase_service.dart';
import '../models/student_model.dart';

/// [SyncController] acts as the orchestration layer for the EduSync data replication strategy.
/// It implements the "Sync-on-Reconnect" and "Sync-on-Start" patterns.
class SyncController extends ChangeNotifier {
  final DatabaseHelper _dbHelper = DatabaseHelper();
  final SupabaseService _supabaseService = SupabaseService();
  final Connectivity _connectivity = Connectivity();

  bool _isSyncing = false;
  bool get isSyncing => _isSyncing;

  String? _lastSyncStatus;
  String? get lastSyncStatus => _lastSyncStatus;

  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  /// Initializes the controller, runs an initial sync, and starts listening for connectivity changes.
  void initialize() {
    // Initial sync attempt
    syncAll();

    // Listen for connectivity changes
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen((List<ConnectivityResult> results) {
      final hasConnection = results.any((result) => 
        result == ConnectivityResult.mobile || 
        result == ConnectivityResult.wifi || 
        result == ConnectivityResult.ethernet
      );
      
      if (hasConnection) {
        debugPrint('Connectivity restored. Triggering auto-sync...');
        syncAll();
      }
    });
  }

  /// The main synchronization loop.
  /// 
  /// Logic:
  /// 1. Check internet availability via Supabase ping.
  /// 2. Pull unsynced students from SQLite -> Push to Supabase -> Mark Local as Synced.
  /// 3. Pull unsynced attendance from SQLite -> Push to Supabase -> Mark Local as Synced.
  Future<void> syncAll() async {
    if (_isSyncing) return;

    _isSyncing = true;
    _lastSyncStatus = "Syncing...";
    notifyListeners();

    try {
      // 0. Quick Health Check
      final online = await _supabaseService.isConnected();
      if (!online) {
        _setFinished("Server unreachable. Offline mode active.");
        return;
      }

      // 1. Sync Students First (Dependencies)
      await _syncStudents();

      // 2. Sync Attendance
      await _syncAttendance();

      _setFinished("Synchronization complete.");
    } catch (e) {
      debugPrint('Sync Error: $e');
      _setFinished("Sync failed: $e");
    }
  }

  Future<void> _syncStudents() async {
    final unsynced = await _dbHelper.getUnsyncedRecords(DatabaseHelper.tableStudents);
    if (unsynced.isEmpty) return;

    final List<StudentModel> students = unsynced.map((m) => StudentModel.fromJson(m)).toList();
    
    // Batch upload to Supabase
    await _supabaseService.syncStudents(students);
    
    // Update local flags
    final ids = students.map((s) => s.id).toList();
    await _dbHelper.markAsSynced(DatabaseHelper.tableStudents, ids);
    debugPrint('Synced ${ids.length} students.');
  }

  Future<void> _syncAttendance() async {
    final unsynced = await _dbHelper.getUnsyncedRecords(DatabaseHelper.tableAttendance);
    if (unsynced.isEmpty) return;

    // Use raw maps for attendance as Supabase service expects List<Map>
    await _supabaseService.syncAttendance(unsynced);

    // Update local flags
    final ids = unsynced.map((m) => m['id'] as String).toList();
    await _dbHelper.markAsSynced(DatabaseHelper.tableAttendance, ids);
    debugPrint('Synced ${ids.length} attendance records.');
  }

  void _setFinished(String message) {
    _isSyncing = false;
    _lastSyncStatus = message;
    notifyListeners();
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    super.dispose();
  }
}

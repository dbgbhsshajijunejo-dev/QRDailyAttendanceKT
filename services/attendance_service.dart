
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';
import 'database_helper.dart';
import 'supabase_service.dart';
import '../models/attendance_model.dart';
import '../models/student_model.dart';

class AttendanceService {
  final DatabaseHelper _dbHelper = DatabaseHelper();
  final SupabaseService _supabaseService = SupabaseService();
  final Uuid _uuid = const Uuid();

  Future<List<String>> getClasses() async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> result = await db.rawQuery(
      'SELECT DISTINCT class_name FROM ${DatabaseHelper.tableStudents} ORDER BY class_name ASC'
    );
    return result.map((row) => row['class_name'] as String).where((c) => c.isNotEmpty).toList();
  }

  Future<List<StudentModel>> getStudentsByClass(String className) async {
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(
      DatabaseHelper.tableStudents,
      where: 'class_name = ?',
      whereArgs: [className],
      orderBy: 'name ASC',
    );
    return List.generate(maps.length, (i) => StudentModel.fromJson(maps[i]));
  }

  /// Fetches aggregated data for a specific day including gender breakdown
  Future<Map<String, dynamic>> getDailyReportData(DateTime date) async {
    final db = await _dbHelper.database;
    final dateStr = date.toIso8601String().split('T')[0];

    // Status Breakdown
    final statusResults = await db.rawQuery('''
      SELECT status, COUNT(*) as count 
      FROM ${DatabaseHelper.tableAttendance}
      WHERE date(timestamp / 1000, 'unixepoch', 'localtime') = ?
      GROUP BY status
    ''', [dateStr]);

    // Gender Breakdown (Join needed)
    final genderResults = await db.rawQuery('''
      SELECT s.gender, a.status, COUNT(*) as count
      FROM ${DatabaseHelper.tableAttendance} a
      JOIN ${DatabaseHelper.tableStudents} s ON a.student_id = s.id
      WHERE date(a.timestamp / 1000, 'unixepoch', 'localtime') = ?
      GROUP BY s.gender, a.status
    ''', [dateStr]);

    return {
      'date': date,
      'statusBreakdown': statusResults,
      'genderBreakdown': genderResults,
    };
  }

  /// Fetches summarized data for a whole month
  Future<Map<String, dynamic>> getMonthlyReportData(int year, int month) async {
    final db = await _dbHelper.database;
    final monthStr = '${year}-${month.toString().padLeft(2, '0')}';

    // Student-wise Summary
    final studentSummary = await db.rawQuery('''
      SELECT 
        s.name, 
        s.gr_number, 
        s.class_name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave_days
      FROM ${DatabaseHelper.tableStudents} s
      LEFT JOIN ${DatabaseHelper.tableAttendance} a ON s.id = a.student_id
      AND strftime('%Y-%m', a.timestamp / 1000, 'unixepoch', 'localtime') = ?
      GROUP BY s.id
      ORDER BY s.class_name, s.name
    ''', [monthStr]);

    // Class-wise Summary
    final classSummary = await db.rawQuery('''
      SELECT 
        s.class_name,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as total_present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as total_absent
      FROM ${DatabaseHelper.tableStudents} s
      JOIN ${DatabaseHelper.tableAttendance} a ON s.id = a.student_id
      WHERE strftime('%Y-%m', a.timestamp / 1000, 'unixepoch', 'localtime') = ?
      GROUP BY s.class_name
    ''', [monthStr]);

    return {
      'period': monthStr,
      'studentSummary': studentSummary,
      'classSummary': classSummary,
    };
  }

  Future<AttendanceResult> saveBulkAttendance({
    required List<AttendanceModel> records,
  }) async {
    try {
      final db = await _dbHelper.database;
      await db.transaction((txn) async {
        for (var record in records) {
          final String dateStr = DateTime.fromMillisecondsSinceEpoch(record.timestamp).toIso8601String().split('T')[0];
          await txn.rawDelete('''
            DELETE FROM ${DatabaseHelper.tableAttendance}
            WHERE student_id = ? 
            AND date(timestamp / 1000, 'unixepoch', 'localtime') = date(?, 'localtime')
          ''', [record.studentId, dateStr]);

          await txn.insert(DatabaseHelper.tableAttendance, record.toJson(), conflictAlgorithm: ConflictAlgorithm.replace);
        }
      });
      _attemptBackgroundSync(records);
      return AttendanceResult(success: true, message: 'Successfully saved ${records.length} records locally.');
    } catch (e) {
      return AttendanceResult(success: false, message: 'Bulk save failed: $e');
    }
  }

  Future<void> _attemptBackgroundSync(List<AttendanceModel> records) async {
    try {
      await _supabaseService.syncAttendance(records.map((r) => r.toJson()).toList());
      await _dbHelper.markAsSynced(DatabaseHelper.tableAttendance, records.map((r) => r.id).toList());
    } catch (e) {
      print('Background bulk sync delayed: $e');
    }
  }

  Future<AttendanceResult> markAttendance({
    required String qrData,
    String status = 'present',
    String? sessionName,
  }) async {
    try {
      final db = await _dbHelper.database;
      final List<Map<String, dynamic>> students = await db.query(
        DatabaseHelper.tableStudents,
        where: 'id = ? OR gr_number = ?',
        whereArgs: [qrData, qrData],
      );

      if (students.isEmpty) return AttendanceResult(success: false, message: 'Student record not found.');

      final student = students.first;
      final studentId = student['id'];
      final studentName = student['name'];
      final grNumber = student['gr_number'];

      final List<Map<String, dynamic>> existing = await db.rawQuery('''
        SELECT id FROM ${DatabaseHelper.tableAttendance} 
        WHERE student_id = ? 
        AND date(timestamp / 1000, 'unixepoch', 'localtime') = date('now', 'localtime')
      ''', [studentId]);

      if (existing.isNotEmpty) {
        return AttendanceResult(success: false, message: '$studentName already marked for today.', studentName: studentName);
      }

      final record = AttendanceModel(
        id: _uuid.v4(),
        studentId: studentId,
        grNumber: grNumber,
        timestamp: DateTime.now().millisecondsSinceEpoch,
        sessionName: sessionName ?? 'Daily Session',
        status: status,
      );

      await db.insert(DatabaseHelper.tableAttendance, record.toJson());

      try {
        await _supabaseService.syncAttendance([record.toJson()]);
        await _dbHelper.markAsSynced(DatabaseHelper.tableAttendance, [record.id]);
      } catch (_) {}

      return AttendanceResult(success: true, message: 'Attendance saved.', studentName: studentName, grNumber: grNumber);
    } catch (e) {
      return AttendanceResult(success: false, message: 'Database Error: $e');
    }
  }

  Future<Map<String, int>> getTodayStats() async {
    final db = await _dbHelper.database;
    final results = await db.rawQuery('''
      SELECT status, COUNT(*) as count FROM ${DatabaseHelper.tableAttendance}
      WHERE date(timestamp / 1000, 'unixepoch', 'localtime') = date('now', 'localtime')
      GROUP BY status
    ''');
    
    Map<String, int> stats = {'present': 0, 'absent': 0, 'leave': 0};
    for (var row in results) {
      stats[row['status'] as String] = row['count'] as int;
    }
    return stats;
  }
}

class AttendanceResult {
  final bool success;
  final String message;
  final String? studentName;
  final String? grNumber;
  AttendanceResult({required this.success, required this.message, this.studentName, this.grNumber});
}

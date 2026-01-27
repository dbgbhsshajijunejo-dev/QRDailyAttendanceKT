
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/student_model.dart';
import 'logger_service.dart';

class SupabaseService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final _logger = LoggerService();

  static Future<void> init({required String url, required String anonKey}) async {
    await Supabase.initialize(url: url, anonKey: anonKey, debug: false);
  }

  Future<void> syncStudents(List<StudentModel> students) async {
    if (students.isEmpty) return;
    final studentData = students.map((s) => s.toJson()).toList();

    try {
      await _supabase.from('students').upsert(studentData, onConflict: 'id');
      _logger.log("Supabase: Synced ${students.length} students.", level: LogLevel.sync);
    } on PostgrestException catch (e) {
      _logger.log("Supabase Students Error (${e.code}): ${e.message}", level: LogLevel.error);
      throw e;
    } catch (e) {
      _logger.log("Unexpected Sync Error (Students)", level: LogLevel.error, error: e);
      throw e;
    }
  }

  Future<void> syncAttendance(List<Map<String, dynamic>> records) async {
    if (records.isEmpty) return;

    try {
      await _supabase.from('attendance').upsert(records, onConflict: 'id');
      _logger.log("Supabase: Synced ${records.length} attendance records.", level: LogLevel.sync);
    } on PostgrestException catch (e) {
      // Handle potential business rule conflicts (e.g., student doesn't exist yet)
      if (e.code == '23503') {
        _logger.log("Supabase Attendance: Foreign Key Violation. Some students not found.", level: LogLevel.warning);
      } else if (e.code == '23505') {
        _logger.log("Supabase Attendance: Unique Constraint Conflict. Record already exists.", level: LogLevel.warning);
      } else {
        _logger.log("Supabase Attendance Error (${e.code}): ${e.message}", level: LogLevel.error);
      }
      throw e;
    } catch (e) {
      _logger.log("Unexpected Sync Error (Attendance)", level: LogLevel.error, error: e);
      throw e;
    }
  }

  Future<bool> isConnected() async {
    try {
      // Timeout sensitive health check
      await _supabase.from('students').select('id').limit(1).timeout(const Duration(seconds: 5));
      return true;
    } catch (e) {
      _logger.log("Supabase: Connection health check failed.", level: LogLevel.warning);
      return false;
    }
  }
}

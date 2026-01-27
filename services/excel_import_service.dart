
import 'dart:io';
import 'package:excel/excel.dart';
import 'package:file_picker/file_picker.dart';
import '../models/student_model.dart';
import 'database_helper.dart';
import 'supabase_service.dart';

/// [ExcelImportService] encapsulates the business logic for migrating 
/// institutional data from legacy spreadsheets to the EduSync platform.
class ExcelImportService {
  final DatabaseHelper _dbHelper = DatabaseHelper();
  final SupabaseService _supabaseService = SupabaseService();

  /// Orchestrates the import process: Pick -> Parse -> Save Locally -> Sync Cloud.
  Future<ImportResult> importStudents() async {
    try {
      // 1. Pick the file
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['xlsx', 'xls'],
      );

      if (result == null || result.files.single.path == null) {
        return ImportResult(success: false, message: 'No file selected');
      }

      var bytes = File(result.files.single.path!).readAsBytesSync();
      var excel = Excel.decodeBytes(bytes);

      List<StudentModel> importedStudents = [];
      int skipRows = 1; // Assume first row is header

      for (var table in excel.tables.keys) {
        var sheet = excel.tables[table]!;
        for (var i = skipRows; i < sheet.maxRows; i++) {
          var row = sheet.rows[i];
          if (row.isEmpty || row[0] == null) continue;

          // Map Excel row to StudentModel
          // Mapping: 0:GR, 1:Name, 2:Father, 3:Caste, 4:Class, 5:Gender, 6:Religion
          final student = StudentModel.fromExcelRow(
            row.map((cell) => cell?.value).toList(),
          );
          importedStudents.add(student);
        }
      }

      if (importedStudents.isEmpty) {
        return ImportResult(success: false, message: 'No valid data found in Excel');
      }

      // 2. Batch Insert to SQLite (Local First)
      // For performance in bulk imports, we should use a transaction or batch
      final db = await _dbHelper.database;
      await db.transaction((txn) async {
        for (var student in importedStudents) {
          await txn.insert(
            DatabaseHelper.tableStudents,
            student.toJson()..['is_synced'] = 0,
            conflictAlgorithm: ConflictAlgorithm.replace,
          );
        }
      });

      // 3. Attempt Bulk Sync to Supabase
      int syncedCount = 0;
      try {
        await _supabaseService.syncStudents(importedStudents);
        await _dbHelper.markAsSynced(
          DatabaseHelper.tableStudents,
          importedStudents.map((s) => s.id).toList(),
        );
        syncedCount = importedStudents.length;
      } catch (e) {
        // We don't fail the whole process if sync fails; data is safe in SQLite
        print('Background sync failed: $e');
      }

      return ImportResult(
        success: true,
        count: importedStudents.length,
        syncedCount: syncedCount,
        message: 'Successfully imported ${importedStudents.length} students.',
      );
    } catch (e) {
      return ImportResult(success: false, message: 'Error processing Excel: $e');
    }
  }
}

class ImportResult {
  final bool success;
  final String message;
  final int count;
  final int syncedCount;

  ImportResult({
    required this.success,
    required this.message,
    this.count = 0,
    this.syncedCount = 0,
  });
}

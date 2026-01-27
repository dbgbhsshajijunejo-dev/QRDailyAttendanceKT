
import 'dart:async';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'logger_service.dart';

class DatabaseHelper {
  static final DatabaseHelper _instance = DatabaseHelper._internal();
  static Database? _database;
  final _logger = LoggerService();

  factory DatabaseHelper() => _instance;
  DatabaseHelper._internal();

  static const String tableStudents = 'students';
  static const String tableAttendance = 'attendance';

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    try {
      String path = join(await getDatabasesPath(), 'edusync_offline.db');
      return await openDatabase(
        path,
        version: 1,
        onCreate: _onCreate,
        onConfigure: _onConfigure,
      );
    } catch (e, stack) {
      _logger.log("Critical: SQLite Initialization Failed", level: LogLevel.error, error: e, stackTrace: stack);
      rethrow;
    }
  }

  Future _onConfigure(Database db) async {
    await db.execute('PRAGMA foreign_keys = ON');
  }

  Future _onCreate(Database db, int version) async {
    _logger.log("Creating local database schema...");
    try {
      await db.execute('''
        CREATE TABLE $tableStudents (
          id TEXT PRIMARY KEY,
          gr_number TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          father_name TEXT,
          caste TEXT,
          class_name TEXT,
          gender TEXT,
          religion TEXT,
          qr_code TEXT,
          is_synced INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      ''');

      await db.execute('''
        CREATE TABLE $tableAttendance (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          gr_number TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          session_name TEXT,
          status TEXT DEFAULT 'present',
          is_synced INTEGER DEFAULT 0,
          FOREIGN KEY (student_id) REFERENCES $tableStudents (id) ON DELETE CASCADE
        )
      ''');

      await db.execute('CREATE INDEX idx_student_gr ON $tableStudents (gr_number)');
      await db.execute('CREATE INDEX idx_attendance_student ON $tableAttendance (student_id)');
      _logger.log("Schema creation successful.");
    } catch (e, stack) {
      _logger.log("SQLite Schema Creation Failed", level: LogLevel.error, error: e, stackTrace: stack);
    }
  }

  Future<int> insertStudent(Map<String, dynamic> student) async {
    try {
      Database db = await database;
      student['is_synced'] = 0;
      return await db.insert(tableStudents, student, conflictAlgorithm: ConflictAlgorithm.replace);
    } catch (e) {
      _logger.log("SQLite Insert Failed (Student)", level: LogLevel.error, error: e);
      return -1;
    }
  }

  Future<void> markAsSynced(String table, List<String> ids) async {
    if (ids.isEmpty) return;
    try {
      Database db = await database;
      Batch batch = db.batch();
      for (var id in ids) {
        batch.update(table, {'is_synced': 1}, where: 'id = ?', whereArgs: [id]);
      }
      await batch.commit(noResult: true);
    } catch (e) {
      _logger.log("SQLite Sync Update Failed for $table", level: LogLevel.error, error: e);
    }
  }

  Future<List<Map<String, dynamic>>> getUnsyncedRecords(String table) async {
    try {
      Database db = await database;
      return await db.query(table, where: 'is_synced = ?', whereArgs: [0]);
    } catch (e) {
      _logger.log("SQLite Read Failed (Unsynced: $table)", level: LogLevel.error, error: e);
      return [];
    }
  }
}

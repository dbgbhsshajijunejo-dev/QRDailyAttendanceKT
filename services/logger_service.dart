
import 'package:flutter/foundation.dart';

enum LogLevel { info, warning, error, sync }

class LoggerService {
  static final LoggerService _instance = LoggerService._internal();
  factory LoggerService() => _instance;
  LoggerService._internal();

  final List<String> _logs = [];
  List<String> get logs => List.unmodifiable(_logs);

  void log(String message, {LogLevel level = LogLevel.info, Object? error, StackTrace? stackTrace}) {
    final timestamp = DateTime.now().toIso8601String();
    final logEntry = "[$timestamp] [${level.name.toUpperCase()}] $message";
    
    _logs.add(logEntry);
    if (_logs.length > 500) _logs.removeAt(0); // Keep last 500 logs

    debugPrint(logEntry);
    if (error != null) {
      debugPrint("Error Details: $error");
      _logs.add("   -> Error: $error");
    }
    if (stackTrace != null && level == LogLevel.error) {
      debugPrint(stackTrace.toString());
    }
  }

  void clear() => _logs.clear();
}

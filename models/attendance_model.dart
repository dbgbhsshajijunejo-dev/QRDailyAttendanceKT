
import 'package:uuid/uuid.dart';

class AttendanceModel {
  final String id;
  final String studentId;
  final String grNumber;
  final int timestamp;
  final String sessionName;
  final String status; // 'present', 'absent', 'leave'
  final bool isSynced;

  AttendanceModel({
    required this.id,
    required this.studentId,
    required this.grNumber,
    required this.timestamp,
    required this.sessionName,
    required this.status,
    this.isSynced = false,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    return AttendanceModel(
      id: json['id'] as String,
      studentId: (json['student_id'] ?? json['studentId']) as String,
      grNumber: (json['gr_number'] ?? json['grNumber']) as String,
      timestamp: json['timestamp'] as int,
      sessionName: (json['session_name'] ?? json['sessionName']) as String,
      status: json['status'] as String,
      isSynced: (json['is_synced'] == 1 || json['isSynced'] == true),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'student_id': studentId,
      'gr_number': grNumber,
      'timestamp': timestamp,
      'session_name': sessionName,
      'status': status,
      'is_synced': isSynced ? 1 : 0,
    };
  }
}

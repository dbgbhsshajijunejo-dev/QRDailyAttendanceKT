
import 'package:uuid/uuid.dart';

/// [StudentModel] is the data representation of a student in the EduSync ecosystem.
/// It follows the Clean Architecture Data Layer pattern, facilitating easy 
/// serialization for both local SQLite (offline) and remote Supabase (online) storage.
class StudentModel {
  /// Primary Key (UUID)
  final String id;
  
  /// General Register Number (Unique Institutional ID)
  final String grNumber;
  
  final String name;
  final String fatherName;
  final String caste;
  final String className;
  final String gender;
  final String religion;
  
  /// The data encoded within the QR code for this specific student
  final String qrCode;

  StudentModel({
    required this.id,
    required this.grNumber,
    required this.name,
    required this.fatherName,
    required this.caste,
    required this.className,
    required this.gender,
    required this.religion,
    required this.qrCode,
  });

  /// Factory constructor to create a [StudentModel] from a Map (JSON).
  /// Handles both snake_case (PostgreSQL/Supabase) and camelCase mappings.
  factory StudentModel.fromJson(Map<String, dynamic> json) {
    return StudentModel(
      id: json['id'] as String,
      grNumber: (json['gr_number'] ?? json['grNumber']) as String,
      name: json['name'] as String,
      fatherName: (json['father_name'] ?? json['fatherName']) as String,
      caste: json['caste'] as String,
      className: (json['class_name'] ?? json['className']) as String,
      gender: json['gender'] as String,
      religion: json['religion'] as String,
      qrCode: (json['qr_code'] ?? json['qrCode']) as String,
    );
  }

  /// Converts the [StudentModel] to a JSON Map for persistence.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'gr_number': grNumber,
      'name': name,
      'father_name': fatherName,
      'caste': caste,
      'class_name': className,
      'gender': gender,
      'religion': religion,
      'qr_code': qrCode,
    };
  }

  /// Implementation of the 'Prototype' pattern for immutable state updates.
  StudentModel copyWith({
    String? id,
    String? grNumber,
    String? name,
    String? fatherName,
    String? caste,
    String? className,
    String? gender,
    String? religion,
    String? qrCode,
  }) {
    return StudentModel(
      id: id ?? this.id,
      grNumber: grNumber ?? this.grNumber,
      name: name ?? this.name,
      fatherName: fatherName ?? this.fatherName,
      caste: caste ?? this.caste,
      className: className ?? this.className,
      gender: gender ?? this.gender,
      religion: religion ?? this.religion,
      qrCode: qrCode ?? this.qrCode,
    );
  }

  /// Parses a row from an Excel data sheet.
  /// 
  /// Logic:
  /// - Generates a new UUID for the [id] field.
  /// - Automatically assigns the [grNumber] as the [qrCode] if available.
  /// - Expected Row Mapping:
  ///   0: GR Number, 1: Name, 2: Father Name, 3: Caste, 4: Class, 5: Gender, 6: Religion
  static StudentModel fromExcelRow(List<dynamic> row) {
    const uuid = Uuid();
    final String generatedId = uuid.v4();
    
    String safeString(int index) {
      if (index >= row.length || row[index] == null) return '';
      return row[index].toString().trim();
    }

    final gr = safeString(0);

    return StudentModel(
      id: generatedId,
      grNumber: gr,
      name: safeString(1),
      fatherName: safeString(2),
      caste: safeString(3),
      className: safeString(4),
      gender: safeString(5),
      religion: safeString(6),
      qrCode: gr.isNotEmpty ? gr : generatedId,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is StudentModel &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          grNumber == other.grNumber;

  @override
  int get hashCode => id.hashCode ^ grNumber.hashCode;

  @override
  String toString() {
    return 'StudentModel(id: $id, gr: $grNumber, name: $name, class: $className)';
  }
}


import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';
import '../services/attendance_service.dart';
import '../models/student_model.dart';
import '../models/attendance_model.dart';

class BulkAttendanceScreen extends StatefulWidget {
  const BulkAttendanceScreen({super.key});

  @override
  State<BulkAttendanceScreen> createState() => _BulkAttendanceScreenState();
}

class _BulkAttendanceScreenState extends State<BulkAttendanceScreen> {
  final AttendanceService _service = AttendanceService();
  final Uuid _uuid = const Uuid();

  String? _selectedClass;
  DateTime _selectedDate = DateTime.now();
  List<String> _classes = [];
  List<StudentModel> _students = [];
  Map<String, String> _attendanceMap = {}; // StudentId -> Status
  bool _isLoading = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadClasses();
  }

  Future<void> _loadClasses() async {
    final classes = await _service.getClasses();
    setState(() => _classes = classes);
  }

  Future<void> _loadStudents(String className) async {
    setState(() => _isLoading = true);
    final students = await _service.getStudentsByClass(className);
    setState(() {
      _students = students;
      // Initialize all as present by default for convenience
      _attendanceMap = {for (var s in students) s.id: 'present'};
      _isLoading = false;
    });
  }

  Future<void> _saveBulk() async {
    if (_selectedClass == null || _students.isEmpty) return;

    setState(() => _isSaving = true);

    final List<AttendanceModel> records = _students.map((student) {
      return AttendanceModel(
        id: _uuid.v4(),
        studentId: student.id,
        grNumber: student.grNumber,
        timestamp: _selectedDate.millisecondsSinceEpoch,
        sessionName: 'Bulk Entry - $_selectedClass',
        status: _attendanceMap[student.id] ?? 'present',
      );
    }).toList();

    final result = await _service.saveBulkAttendance(records: records);

    if (mounted) {
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result.message),
          backgroundColor: result.success ? Colors.green : Colors.red,
        ),
      );
      if (result.success) Navigator.pop(context);
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() => _selectedDate = picked);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bulk Attendance'),
        actions: [
          if (_students.isNotEmpty)
            TextButton(
              onPressed: _isSaving ? null : _saveBulk,
              child: _isSaving 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('SAVE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: Column(
        children: [
          // Filter Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
            ),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedClass,
                    hint: const Text('Select Class'),
                    items: _classes.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setState(() => _selectedClass = val);
                        _loadStudents(val);
                      }
                    },
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12),
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                InkWell(
                  onTap: _selectDate,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[400]!),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.calendar_today, size: 16),
                        const SizedBox(width: 8),
                        Text(DateFormat('MMM dd').format(_selectedDate)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Student List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _selectedClass == null
                    ? _buildEmptyState('Please select a class to begin.')
                    : _students.isEmpty
                        ? _buildEmptyState('No students found in this class.')
                        : ListView.builder(
                            padding: const EdgeInsets.all(12),
                            itemCount: _students.length,
                            itemBuilder: (context, index) {
                              final student = _students[index];
                              return _buildStudentCard(student);
                            },
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentCard(StudentModel student) {
    final status = _attendanceMap[student.id] ?? 'present';

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: Colors.indigo[50],
              child: Text(student.name[0], style: const TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(student.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text('GR: ${student.grNumber}', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                ],
              ),
            ),
            // Segmented Toggle
            Row(
              children: [
                _statusButton(student.id, 'P', 'present', Colors.green, status == 'present'),
                _statusButton(student.id, 'A', 'absent', Colors.red, status == 'absent'),
                _statusButton(student.id, 'L', 'leave', Colors.blue, status == 'leave'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _statusButton(String studentId, String label, String value, Color color, bool isSelected) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _attendanceMap[studentId] = value;
        });
      },
      child: Container(
        width: 34,
        height: 34,
        margin: const EdgeInsets.only(left: 4),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.transparent,
          border: Border.all(color: isSelected ? color : Colors.grey[300]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : Colors.grey[600],
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(String msg) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.group_outlined, size: 64, color: Colors.grey[300]),
          const SizedBox(height: 16),
          Text(msg, style: TextStyle(color: Colors.grey[500])),
        ],
      ),
    );
  }
}

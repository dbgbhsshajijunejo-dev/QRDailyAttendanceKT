
import 'package:flutter/material.dart';
import '../models/student_model.dart';
import '../services/database_helper.dart';
import 'excel_import_screen.dart';
import 'add_student_screen.dart';

class StudentsScreen extends StatefulWidget {
  const StudentsScreen({super.key});

  @override
  State<StudentsScreen> createState() => _StudentsScreenState();
}

class _StudentsScreenState extends State<StudentsScreen> {
  final _dbHelper = DatabaseHelper();
  List<StudentModel> _students = [];
  List<StudentModel> _filteredStudents = [];
  bool _isLoading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadStudents();
  }

  Future<void> _loadStudents() async {
    setState(() => _isLoading = true);
    final db = await _dbHelper.database;
    final List<Map<String, dynamic>> maps = await db.query(DatabaseHelper.tableStudents);
    final students = List.generate(maps.length, (i) => StudentModel.fromJson(maps[i]));
    
    setState(() {
      _students = students;
      _filteredStudents = students;
      _isLoading = false;
    });
  }

  void _filterStudents(String query) {
    setState(() {
      _filteredStudents = _students.where((s) => 
        s.name.toLowerCase().contains(query.toLowerCase()) || 
        s.grNumber.contains(query)
      ).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Student Directory'),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_upload_outlined),
            tooltip: 'Import from Excel',
            onPressed: () async {
              await Navigator.push(
                context, 
                MaterialPageRoute(builder: (_) => const ExcelImportScreen())
              );
              _loadStudents();
            },
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () async {
              await Navigator.push(
                context, 
                MaterialPageRoute(builder: (_) => const AddStudentScreen())
              );
              _loadStudents();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              controller: _searchController,
              onChanged: _filterStudents,
              decoration: InputDecoration(
                hintText: 'Search by Name or GR#',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.grey[100],
              ),
            ),
          ),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : _filteredStudents.isEmpty
                ? Center(child: Text('No students found', style: TextStyle(color: Colors.grey[500])))
                : ListView.builder(
                    itemCount: _filteredStudents.length,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemBuilder: (context, index) {
                      final student = _filteredStudents[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: Colors.indigo[100],
                            child: Text(student.name[0], style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.indigo)),
                          ),
                          title: Text(student.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text('GR: ${student.grNumber} • Class: ${student.className}'),
                          trailing: const Icon(Icons.chevron_right, color: Colors.grey),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

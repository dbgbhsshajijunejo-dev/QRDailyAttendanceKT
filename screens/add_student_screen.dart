
import 'package:flutter/material.dart';
import 'package:uuid/uuid.dart';
import '../models/student_model.dart';
import '../services/database_helper.dart';
import '../services/supabase_service.dart';

class AddStudentScreen extends StatefulWidget {
  const AddStudentScreen({super.key});

  @override
  State<AddStudentScreen> createState() => _AddStudentScreenState();
}

class _AddStudentScreenState extends State<AddStudentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _uuid = const Uuid();
  
  // Controllers
  final _grController = TextEditingController();
  final _nameController = TextEditingController();
  final _fatherNameController = TextEditingController();
  final _casteController = TextEditingController();
  final _classController = TextEditingController();
  final _religionController = TextEditingController();
  
  String _selectedGender = 'Male';
  bool _isSaving = false;

  @override
  void dispose() {
    _grController.dispose();
    _nameController.dispose();
    _fatherNameController.dispose();
    _casteController.dispose();
    _classController.dispose();
    _religionController.dispose();
    super.dispose();
  }

  Future<void> _saveStudent() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final studentId = _uuid.v4();
      
      // 1. Create Model
      // Logic: Generate QR code data using the unique UUID for maximum reliability
      final student = StudentModel(
        id: studentId,
        grNumber: _grController.text.trim(),
        name: _nameController.text.trim(),
        fatherName: _fatherNameController.text.trim(),
        caste: _casteController.text.trim(),
        className: _classController.text.trim(),
        gender: _selectedGender,
        religion: _religionController.text.trim(),
        qrCode: studentId, 
      );

      // 2. Save to SQLite (Offline First)
      final dbHelper = DatabaseHelper();
      await dbHelper.insertStudent(student.toJson());

      // 3. Attempt Cloud Sync (Online Second)
      bool synced = false;
      try {
        final supabase = SupabaseService();
        await supabase.syncStudents([student]);
        await dbHelper.markAsSynced(DatabaseHelper.tableStudents, [student.id]);
        synced = true;
      } catch (e) {
        debugPrint('Sync failed, kept in local storage: $e');
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(synced 
              ? 'Student registered and synced successfully!' 
              : 'Saved locally. Will sync when online.'),
            backgroundColor: synced ? Colors.green : Colors.orange,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Register New Student'),
        centerTitle: true,
      ),
      body: _isSaving 
        ? const Center(child: CircularProgressIndicator())
        : SingleChildScrollView(
            padding: const EdgeInsets.all(20.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildSectionHeader('Institutional Details'),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _grController,
                    decoration: const InputDecoration(
                      labelText: 'GR Number',
                      prefixIcon: Icon(Icons.numbers),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v!.isEmpty ? 'Enter GR Number' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _classController,
                    decoration: const InputDecoration(
                      labelText: 'Class/Grade',
                      prefixIcon: Icon(Icons.school),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v!.isEmpty ? 'Enter Class' : null,
                  ),
                  
                  const SizedBox(height: 32),
                  _buildSectionHeader('Personal Information'),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Student Full Name',
                      prefixIcon: Icon(Icons.person),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v!.isEmpty ? 'Enter Full Name' : null,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _fatherNameController,
                    decoration: const InputDecoration(
                      labelText: 'Father\'s Name',
                      prefixIcon: Icon(Icons.person_outline),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) => v!.isEmpty ? 'Enter Father\'s Name' : null,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _selectedGender,
                          decoration: const InputDecoration(
                            labelText: 'Gender',
                            border: OutlineInputBorder(),
                          ),
                          items: ['Male', 'Female', 'Other']
                              .map((g) => DropdownMenuItem(value: g, child: Text(g)))
                              .toList(),
                          onChanged: (v) => setState(() => _selectedGender = v!),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: _religionController,
                          decoration: const InputDecoration(
                            labelText: 'Religion',
                            border: OutlineInputBorder(),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _casteController,
                    decoration: const InputDecoration(
                      labelText: 'Caste/Category',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  
                  const SizedBox(height: 40),
                  ElevatedButton(
                    onPressed: _isSaving ? null : _saveStudent,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      backgroundColor: Theme.of(context).primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Save Student Record', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Row(
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Colors.grey[600],
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(child: Divider(color: Colors.grey[300])),
      ],
    );
  }
}

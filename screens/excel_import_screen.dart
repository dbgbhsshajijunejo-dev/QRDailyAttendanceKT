
import 'package:flutter/material.dart';
import '../services/excel_import_service.dart';

class ExcelImportScreen extends StatefulWidget {
  const ExcelImportScreen({super.key});

  @override
  State<ExcelImportScreen> createState() => _ExcelImportScreenState();
}

class _ExcelImportScreenState extends State<ExcelImportScreen> {
  final _importService = ExcelImportService();
  bool _isProcessing = false;
  ImportResult? _lastResult;

  Future<void> _handleImport() async {
    setState(() {
      _isProcessing = true;
      _lastResult = null;
    });

    final result = await _importService.importStudents();

    if (mounted) {
      setState(() {
        _isProcessing = false;
        _lastResult = result;
      });
      
      if (!result.success && result.message != 'No file selected') {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.message), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Bulk Import Students')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.indigo[50],
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.description_outlined,
                  size: 64,
                  color: Colors.indigo[600],
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Import from Excel',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              const Text(
                'Please ensure your Excel file has headers:\nGR#, Name, Father Name, Caste, Class, Gender, Religion',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
              const SizedBox(height: 48),
              
              if (_isProcessing)
                const Column(
                  children: [
                    CircularProgressIndicator(),
                    SizedBox(height: 16),
                    Text('Parsing spreadsheet and syncing...'),
                  ],
                )
              else ...[
                ElevatedButton.icon(
                  onPressed: _handleImport,
                  icon: const Icon(Icons.file_upload),
                  label: const Text('Select Excel File'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(double.infinity, 56),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                if (_lastResult != null && _lastResult!.success) ...[
                  const SizedBox(height: 24),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.green[50],
                      border: Border.all(color: Colors.green[200]!),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'Import Successful!',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green),
                        ),
                        const SizedBox(height: 8),
                        Text('Total Students: ${_lastResult!.count}'),
                        Text('Synced to Cloud: ${_lastResult!.syncedCount}'),
                        if (_lastResult!.count > _lastResult!.syncedCount)
                          const Text(
                            '(Some records stored locally for later sync)',
                            style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic),
                          ),
                      ],
                    ),
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

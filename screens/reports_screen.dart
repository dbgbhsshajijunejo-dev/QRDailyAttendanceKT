
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/database_helper.dart';
import '../services/pdf_generation_service.dart';
import '../services/attendance_service.dart';
import '../services/image_report_service.dart';
import '../models/student_model.dart';
import '../components/daily_report_image_widget.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _pdfService = PdfGenerationService();
  final _imgService = ImageReportService();
  final _attendanceService = AttendanceService();
  final _dbHelper = DatabaseHelper();
  final GlobalKey _reportKey = GlobalKey();
  
  bool _isLoading = false;

  Future<void> _generateDailyImageReport() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.light(
              primary: Colors.indigo,
              onPrimary: Colors.white,
              onSurface: Colors.indigo.shade900,
            ),
          ),
          child: child!,
        );
      },
    );

    if (picked == null) return;

    setState(() => _isLoading = true);
    try {
      final db = await _dbHelper.database;
      final dateStr = DateFormat('yyyy-MM-dd').format(picked);
      
      final boysStats = await _fetchGenderStats(db, dateStr, 'Male');
      final girlsStats = await _fetchGenderStats(db, dateStr, 'Female');

      if (mounted) {
        _showImagePreviewDialog(picked, boysStats, girlsStats);
      }
    } catch (e) {
      _showMessage('Data fetch failed: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<Map<String, int>> _fetchGenderStats(dynamic db, String dateStr, String gender) async {
    final results = await db.rawQuery('''
      SELECT a.status, COUNT(*) as count
      FROM attendance a
      JOIN students s ON a.student_id = s.id
      WHERE date(a.timestamp / 1000, 'unixepoch', 'localtime') = ?
      AND s.gender = ?
      GROUP BY a.status
    ''', [dateStr, gender]);

    Map<String, int> stats = {'present': 0, 'absent': 0, 'leave': 0};
    for (var row in results) {
      stats[row['status'] as String] = row['count'] as int;
    }
    return stats;
  }

  void _showImagePreviewDialog(DateTime date, Map<String, int> b, Map<String, int> g) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        insetPadding: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  const Icon(Icons.preview, color: Colors.indigo),
                  const SizedBox(width: 12),
                  const Text(
                    "Report Preview",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            Flexible(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  decoration: BoxDecoration(
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: RepaintBoundary(
                    key: _reportKey,
                    child: DailyReportImageWidget(
                      date: date,
                      schoolName: "EduSync International School",
                      boysStats: b,
                      girlsStats: g,
                    ),
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: ElevatedButton.icon(
                onPressed: () async {
                  Navigator.pop(context);
                  setState(() => _isLoading = true);
                  final path = await _imgService.captureAndSaveReport(
                    _reportKey, 
                    "Daily_Report_${DateFormat('yyyyMMdd').format(date)}"
                  );
                  setState(() => _isLoading = false);
                  if (path != null) {
                    _showMessage("Report saved to gallery!", isError: false);
                  }
                }, 
                icon: const Icon(Icons.download),
                label: const Text("GENERATE HIGH QUALITY PNG"),
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 56),
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _generateAllCards() async {
    setState(() => _isLoading = true);
    try {
      final db = await _dbHelper.database;
      final List<Map<String, dynamic>> maps = await db.query(DatabaseHelper.tableStudents);
      final students = List.generate(maps.length, (i) => StudentModel.fromJson(maps[i]));

      if (students.isEmpty) {
        _showMessage('No students found to generate cards.');
        return;
      }
      await _pdfService.generateAndPrintCards(students);
    } catch (e) {
      _showMessage('Error: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _generateDailyReport() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );

    if (picked == null) return;

    setState(() => _isLoading = true);
    try {
      final data = await _attendanceService.getDailyReportData(picked);
      await _pdfService.generateDailyReport(data);
    } catch (e) {
      _showMessage('Daily Report failed: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _generateMonthlyReport() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );

    if (picked == null) return;

    setState(() => _isLoading = true);
    try {
      final data = await _attendanceService.getMonthlyReportData(picked.year, picked.month);
      await _pdfService.generateMonthlyReport(data);
    } catch (e) {
      _showMessage('Monthly Report failed: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showMessage(String msg, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg), 
        backgroundColor: isError ? Colors.red : Colors.green.shade700,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reports & Analysis'),
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Colors.indigo),
              SizedBox(height: 16),
              Text('Generating professional report...', style: TextStyle(fontWeight: FontWeight.w500))
            ]))
        : Padding(
        padding: const EdgeInsets.all(20.0),
        child: ListView(
          children: [
            _buildActionCard(
              title: 'Daily WhatsApp Summary',
              description: 'Beautiful image report optimized for messaging apps.',
              icon: Icons.share_outlined,
              onTap: _generateDailyImageReport,
              accentColor: Colors.green,
            ),
            const SizedBox(height: 16),
            _buildActionCard(
              title: 'Attendance QR Cards',
              description: 'Bulk print identity cards for all registered students.',
              icon: Icons.qr_code_2,
              onTap: _generateAllCards,
              accentColor: Colors.indigo,
            ),
            const SizedBox(height: 16),
            _buildActionCard(
              title: 'Daily Summary (PDF)',
              description: 'Official document with gender-wise breakdown.',
              icon: Icons.picture_as_pdf_outlined,
              onTap: _generateDailyReport,
              accentColor: Colors.red,
            ),
            const SizedBox(height: 16),
            _buildActionCard(
              title: 'Monthly Ledger (PDF)',
              description: 'Detailed monthly summary for institutional audit.',
              icon: Icons.calendar_month_outlined,
              onTap: _generateMonthlyReport,
              accentColor: Colors.blue,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required String title,
    required String description,
    required IconData icon,
    required VoidCallback? onTap,
    required Color accentColor,
  }) {
    return Card(
      elevation: 2,
      shadowColor: Colors.black.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: accentColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: accentColor, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title, 
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.black87)
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description, 
                      style: TextStyle(color: Colors.grey[600], fontSize: 13, height: 1.4)
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}

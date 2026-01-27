
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:barcode/barcode.dart';
import 'package:intl/intl.dart';
import '../models/student_model.dart';

class PdfGenerationService {
  static const String schoolName = "EDU-SYNC INTERNATIONAL SCHOOL";
  
  /// Generates a PDF containing attendance cards for the provided list of students.
  Future<void> generateAndPrintCards(List<StudentModel> students) async {
    final pdf = pw.Document();
    for (var i = 0; i < students.length; i += 4) {
      final end = (i + 4 < students.length) ? i + 4 : students.length;
      final pageStudents = students.sublist(i, end);
      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(20),
          build: (pw.Context context) {
            return pw.GridView(
              crossAxisCount: 2,
              childAspectRatio: 0.75,
              children: pageStudents.map((student) => _buildAttendanceCard(student)).toList(),
            );
          },
        ),
      );
    }
    await Printing.layoutPdf(onLayout: (PdfPageFormat format) async => pdf.save(), name: 'Attendance_Cards.pdf');
  }

  /// Generates Daily Attendance Summary Report
  Future<void> generateDailyReport(Map<String, dynamic> data) async {
    final pdf = pw.Document();
    final date = data['date'] as DateTime;
    final statusData = data['statusBreakdown'] as List<Map<String, dynamic>>;
    final genderData = data['genderBreakdown'] as List<Map<String, dynamic>>;

    pdf.addPage(
      pw.Page(
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            _buildReportHeader("DAILY ATTENDANCE SUMMARY", DateFormat('EEEE, MMM dd, yyyy').format(date)),
            pw.SizedBox(height: 20),
            
            pw.Text("OVERALL STATISTICS", style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14)),
            pw.Divider(),
            pw.TableHelper.fromTextArray(
              headers: ['Status', 'Count'],
              data: statusData.map((row) => [row['status'].toString().toUpperCase(), row['count']]).toList(),
              headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.white),
              headerDecoration: const pw.BoxDecoration(color: PdfColors.indigo),
              cellAlignment: pw.Alignment.centerLeft,
            ),

            pw.SizedBox(height: 30),
            pw.Text("GENDER-WISE BREAKDOWN", style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14)),
            pw.Divider(),
            pw.TableHelper.fromTextArray(
              headers: ['Gender', 'Status', 'Count'],
              data: genderData.map((row) => [row['gender'], row['status'].toString().toUpperCase(), row['count']]).toList(),
              headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.white),
              headerDecoration: const pw.BoxDecoration(color: PdfColors.blueGrey700),
            ),
          ],
        ),
      ),
    );

    await Printing.layoutPdf(onLayout: (format) async => pdf.save(), name: 'Daily_Report_${DateFormat('yyyy-MM-dd').format(date)}.pdf');
  }

  /// Generates Monthly Attendance Summary Report
  Future<void> generateMonthlyReport(Map<String, dynamic> data) async {
    final pdf = pw.Document();
    final period = data['period'] as String;
    final studentSummary = data['studentSummary'] as List<Map<String, dynamic>>;
    final classSummary = data['classSummary'] as List<Map<String, dynamic>>;

    // Page 1: Summary
    pdf.addPage(
      pw.Page(
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            _buildReportHeader("MONTHLY ATTENDANCE REPORT", period),
            pw.SizedBox(height: 20),
            pw.Text("CLASS-WISE PERFORMANCE", style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14)),
            pw.Divider(),
            pw.TableHelper.fromTextArray(
              headers: ['Class', 'Total Present', 'Total Absent'],
              data: classSummary.map((row) => [row['class_name'], row['total_present'], row['total_absent']]).toList(),
              headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.white),
              headerDecoration: const pw.BoxDecoration(color: PdfColors.indigo800),
            ),
          ],
        ),
      ),
    );

    // Following Pages: Student Details (Paginated)
    for (var i = 0; i < studentSummary.length; i += 25) {
      final chunk = studentSummary.sublist(i, (i + 25 < studentSummary.length) ? i + 25 : studentSummary.length);
      pdf.addPage(
        pw.Page(
          build: (context) => pw.Column(
            children: [
              pw.Text("STUDENT LEDGER (Page ${(i/25 + 1).toInt()})", style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),
              pw.TableHelper.fromTextArray(
                headers: ['GR#', 'Name', 'Class', 'P', 'A', 'L'],
                data: chunk.map((row) => [
                  row['gr_number'], 
                  row['name'], 
                  row['class_name'], 
                  row['present_days'], 
                  row['absent_days'], 
                  row['leave_days']
                ]).toList(),
                headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold),
                cellStyle: const pw.TextStyle(fontSize: 10),
              ),
            ],
          ),
        ),
      );
    }

    await Printing.layoutPdf(onLayout: (format) async => pdf.save(), name: 'Monthly_Report_$period.pdf');
  }

  pw.Widget _buildReportHeader(String title, String sub) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(schoolName, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 16)),
            pw.Text(title, style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey700)),
          ],
        ),
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.end,
          children: [
            pw.Text("Period: $sub", style: const pw.TextStyle(fontSize: 10)),
            pw.Text("Generated: ${DateFormat('yyyy-MM-dd HH:mm').format(DateTime.now())}", style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey)),
          ],
        ),
      ],
    );
  }

  pw.Widget _buildAttendanceCard(StudentModel student) {
    return pw.Container(
      margin: const pw.EdgeInsets.all(10),
      padding: const pw.EdgeInsets.all(15),
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: PdfColors.black, width: 1),
        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
      ),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.center,
        children: [
          pw.Text(schoolName, textAlign: pw.TextAlign.center, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
          pw.Divider(thickness: 1, color: PdfColors.grey300),
          pw.SizedBox(height: 10),
          pw.Text("ATTENDANCE CARD", style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: PdfColors.indigo)),
          pw.SizedBox(height: 15),
          pw.Expanded(
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                _detailRow("Name:", student.name.toUpperCase()),
                _detailRow("GR #:", student.grNumber),
                _detailRow("Class:", student.className),
                _detailRow("Father:", student.fatherName),
                _detailRow("Gender:", student.gender),
              ],
            ),
          ),
          pw.Container(
            height: 80,
            width: 80,
            child: pw.BarcodeWidget(barcode: Barcode.qrCode(), data: student.qrCode, drawText: false, color: PdfColors.black),
          ),
          pw.SizedBox(height: 5),
          pw.Text("Scan for Attendance", style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey)),
        ],
      ),
    );
  }

  pw.Widget _detailRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 2),
      child: pw.Row(
        children: [
          pw.SizedBox(width: 45, child: pw.Text(label, style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold))),
          pw.Expanded(child: pw.Text(value, style: const pw.TextStyle(fontSize: 9), overflow: pw.TextOverflow.clip)),
        ],
      ),
    );
  }
}


import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class DailyReportImageWidget extends StatelessWidget {
  final DateTime date;
  final String schoolName;
  final Map<String, int> boysStats; // {'present': 0, 'absent': 0, 'leave': 0}
  final Map<String, int> girlsStats;

  const DailyReportImageWidget({
    super.key,
    required this.date,
    required this.schoolName,
    required this.boysStats,
    required this.girlsStats,
  });

  @override
  Widget build(BuildContext context) {
    // Calculations
    int totalBoys = boysStats.values.fold(0, (sum, val) => sum + val);
    int totalGirls = girlsStats.values.fold(0, (sum, val) => sum + val);
    
    int totalPresent = (boysStats['present'] ?? 0) + (girlsStats['present'] ?? 0);
    int totalAbsent = (boysStats['absent'] ?? 0) + (girlsStats['absent'] ?? 0);
    int totalLeave = (boysStats['leave'] ?? 0) + (girlsStats['leave'] ?? 0);
    int grandTotal = totalBoys + totalGirls;

    return Container(
      width: 700, // Slightly wider for better WhatsApp aspect ratio
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.indigo.shade900, width: 4),
      ),
      padding: const EdgeInsets.all(48),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Header Section
          Container(
            padding: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: Colors.indigo.shade100, width: 2)),
            ),
            child: Column(
              children: [
                Text(
                  schoolName.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 28, 
                    fontWeight: FontWeight.w900, 
                    color: Colors.indigo.shade900,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.indigo.shade900,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    "DAILY ATTENDANCE SUMMARY",
                    style: TextStyle(
                      fontSize: 14, 
                      fontWeight: FontWeight.bold, 
                      color: Colors.white, 
                      letterSpacing: 2,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.calendar_today, size: 16, color: Colors.indigo.shade700),
                    const SizedBox(width: 8),
                    Text(
                      DateFormat('EEEE, MMMM dd, yyyy').format(date),
                      style: TextStyle(
                        fontSize: 16, 
                        fontWeight: FontWeight.w600,
                        color: Colors.indigo.shade700,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 40),
          
          // Main Data Table
          Table(
            border: TableBorder(
              horizontalInside: BorderSide(color: Colors.grey.shade300, width: 1),
              verticalInside: BorderSide(color: Colors.grey.shade300, width: 1),
              bottom: BorderSide(color: Colors.indigo.shade900, width: 2),
              top: BorderSide(color: Colors.indigo.shade900, width: 2),
              left: BorderSide(color: Colors.indigo.shade900, width: 2),
              right: BorderSide(color: Colors.indigo.shade900, width: 2),
            ),
            columnWidths: const {
              0: FlexColumnWidth(2.5),
              1: FlexColumnWidth(1),
              2: FlexColumnWidth(1),
              3: FlexColumnWidth(1.5),
            },
            children: [
              // Header Row
              _buildRow(['STATUS', 'BOYS', 'GIRLS', 'TOTAL'], isHeader: true),
              
              // Data Rows
              _buildRow(['PRESENT', '${boysStats['present']}', '${girlsStats['present']}', '$totalPresent'], statusColor: Colors.green.shade700),
              _buildRow(['ABSENT', '${boysStats['absent']}', '${girlsStats['absent']}', '$totalAbsent'], statusColor: Colors.red.shade700),
              _buildRow(['ON LEAVE', '${boysStats['leave']}', '${girlsStats['leave']}', '$totalLeave'], statusColor: Colors.orange.shade700),
              
              // Total Row
              _buildRow(['GRAND TOTAL', '$totalBoys', '$totalGirls', '$grandTotal'], isTotal: true),
            ],
          ),
          
          const SizedBox(height: 60),
          
          // Signatures Section
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _signatureLine("Class Incharge"),
              _signatureLine("System Administrator"),
              _signatureLine("Principal Seal"),
            ],
          ),
          
          const SizedBox(height: 40),
          
          // Footer
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "EduSync Secure Offline Record",
                style: TextStyle(fontSize: 10, color: Colors.grey.shade400, fontWeight: FontWeight.w500),
              ),
              Text(
                "Exported: ${DateFormat('dd-MM-yyyy HH:mm').format(DateTime.now())}",
                style: TextStyle(fontSize: 10, color: Colors.grey.shade400, fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ],
      ),
    );
  }

  TableRow _buildRow(List<String> cells, {bool isHeader = false, bool isTotal = false, Color? statusColor}) {
    return TableRow(
      decoration: BoxDecoration(
        color: isHeader ? Colors.indigo.shade900 : (isTotal ? Colors.indigo.shade50 : Colors.white),
      ),
      children: cells.asMap().entries.map((entry) {
        final index = entry.key;
        final cell = entry.value;
        final isFirstColumn = index == 0;
        
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          child: Text(
            cell,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: (isHeader || isTotal) ? 14 : 15,
              fontWeight: (isHeader || isTotal) ? FontWeight.bold : FontWeight.w500,
              color: isHeader 
                ? Colors.white 
                : (isFirstColumn && statusColor != null ? statusColor : Colors.black87),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _signatureLine(String title) {
    return Column(
      children: [
        Container(
          width: 140, 
          height: 1.5, 
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.white, Colors.indigo.shade900, Colors.white],
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          title, 
          style: TextStyle(
            fontSize: 11, 
            fontWeight: FontWeight.bold, 
            color: Colors.indigo.shade900,
          ),
        ),
      ],
    );
  }
}


import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../services/attendance_service.dart';
import '../services/logger_service.dart';

class ScanAttendanceScreen extends StatefulWidget {
  const ScanAttendanceScreen({super.key});

  @override
  State<ScanAttendanceScreen> createState() => _ScanAttendanceScreenState();
}

class _ScanAttendanceScreenState extends State<ScanAttendanceScreen> {
  final AttendanceService _attendanceService = AttendanceService();
  final LoggerService _logger = LoggerService();
  late final MobileScannerController _cameraController;
  
  bool _isProcessing = false;
  String _selectedStatus = 'present';
  Map<String, int> _todayStats = {'present': 0, 'absent': 0, 'leave': 0};
  
  // UI feedback states
  String? _lastScanName;
  bool? _lastScanSuccess;

  @override
  void initState() {
    super.initState();
    _cameraController = MobileScannerController();
    _refreshStats();
  }

  Future<void> _refreshStats() async {
    try {
      final stats = await _attendanceService.getTodayStats();
      if (mounted) setState(() => _todayStats = stats);
    } catch (e) {
      _logger.log("Failed to refresh today stats", level: LogLevel.warning, error: e);
    }
  }

  void _onDetect(BarcodeCapture capture) async {
    if (_isProcessing) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;

    final String? code = barcodes.first.rawValue;
    if (code == null || code.isEmpty) return;

    setState(() {
      _isProcessing = true;
      _lastScanName = "Processing...";
      _lastScanSuccess = null;
    });

    HapticFeedback.heavyImpact();

    try {
      final result = await _attendanceService.markAttendance(
        qrData: code,
        status: _selectedStatus,
      );

      if (mounted) {
        setState(() {
          _lastScanName = result.studentName ?? result.message;
          _lastScanSuccess = result.success;
        });
        _refreshStats();
      }
    } catch (e) {
      _logger.log("Scan error", level: LogLevel.error, error: e);
      setState(() => _lastScanSuccess = false);
    } finally {
      // Cooldown to prevent duplicate accidental scans
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) {
          setState(() {
            _isProcessing = false;
            _lastScanName = null;
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Scanner'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => _cameraController.toggleTorch(),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildStatsHeader(),
          Expanded(
            child: Stack(
              children: [
                MobileScanner(
                  controller: _cameraController,
                  onDetect: _onDetect,
                ),
                _buildScannerOverlay(),
                if (_lastScanName != null) _buildResultOverlay(),
              ],
            ),
          ),
          _buildStatusSelector(),
        ],
      ),
    );
  }

  Widget _buildStatsHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _statCol('Present', _todayStats['present']!, Colors.green),
          _statCol('Absent', _todayStats['absent']!, Colors.red),
          _statCol('Leave', _todayStats['leave']!, Colors.blue),
        ],
      ),
    );
  }

  Widget _statCol(String label, int val, Color color) {
    return Column(
      children: [
        Text('$val', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildScannerOverlay() {
    return Center(
      child: Container(
        width: 250,
        height: 250,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.white.withOpacity(0.5), width: 2),
          borderRadius: BorderRadius.circular(24),
        ),
        child: const Center(
          child: Icon(Icons.qr_code_scanner, color: Colors.white24, size: 64),
        ),
      ),
    );
  }

  Widget _buildResultOverlay() {
    final color = _lastScanSuccess == null ? Colors.indigo : (_lastScanSuccess! ? Colors.green : Colors.red);
    return Positioned(
      bottom: 20,
      left: 20,
      right: 20,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.9),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            Icon(
              _lastScanSuccess == null ? Icons.sync : (_lastScanSuccess! ? Icons.check_circle : Icons.error),
              color: Colors.white,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                _lastScanName!,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusSelector() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _statusChip('Present', 'present', Colors.green),
          const SizedBox(width: 8),
          _statusChip('Absent', 'absent', Colors.red),
          const SizedBox(width: 8),
          _statusChip('Leave', 'leave', Colors.blue),
        ],
      ),
    );
  }

  Widget _statusChip(String label, String value, Color color) {
    final isSelected = _selectedStatus == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (s) => setState(() => _selectedStatus = value),
      selectedColor: color.withOpacity(0.2),
      labelStyle: TextStyle(color: isSelected ? color : Colors.black87),
    );
  }

  @override
  void dispose() {
    _cameraController.dispose();
    super.dispose();
  }
}

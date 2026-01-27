
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
    if (code == null || code.isEmpty) {
      _logger.log("Malformed QR Code detected", level: LogLevel.warning);
      return;
    }

    setState(() => _isProcessing = true);
    HapticFeedback.mediumImpact();

    try {
      final result = await _attendanceService.markAttendance(
        qrData: code,
        status: _selectedStatus,
      );

      if (mounted) {
        _showFeedback(result);
        _refreshStats();
      }
    } catch (e) {
      _logger.log("Failed to process scanned QR", level: LogLevel.error, error: e);
      if (mounted) {
        _showFeedback(AttendanceResult(success: false, message: "Internal scanning error."));
      }
    } finally {
      Future.delayed(const Duration(seconds: 2), () {
        if (mounted) setState(() => _isProcessing = false);
      });
    }
  }

  void _showFeedback(AttendanceResult result) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(result.message),
        backgroundColor: result.success ? Colors.green[700] : Colors.red[700],
        duration: const Duration(seconds: 2),
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Scanner'),
        actions: [
          ValueListenableBuilder(
            valueListenable: _cameraController.torchState,
            builder: (context, state, child) {
              return IconButton(
                icon: Icon(state == TorchState.on ? Icons.flash_on : Icons.flash_off),
                onPressed: () => _cameraController.toggleTorch(),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Header Stats
          Container(
            padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _statItem('P', _todayStats['present']!, Colors.green),
                    _statItem('A', _todayStats['absent']!, Colors.red),
                    _statItem('L', _todayStats['leave']!, Colors.blue),
                  ],
                ),
                const SizedBox(height: 20),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [_statusChip('Present', 'present', Colors.green), const SizedBox(width: 8), _statusChip('Absent', 'absent', Colors.red), const SizedBox(width: 8), _statusChip('Leave', 'leave', Colors.blue)],
                  ),
                ),
              ],
            ),
          ),
          
          Expanded(
            child: Stack(
              children: [
                MobileScanner(
                  controller: _cameraController,
                  onDetect: _onDetect,
                  errorBuilder: (context, error, child) {
                    _logger.log("Camera hardware error", level: LogLevel.error, error: error);
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, size: 48, color: Colors.red),
                          const SizedBox(height: 16),
                          Text(error.errorCode == MobileScannerErrorCode.permissionDenied 
                            ? "Camera Permission Denied" 
                            : "Camera Hardware Error",
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                Center(
                  child: Container(
                    width: 260,
                    height: 260,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.white.withOpacity(0.5), width: 2),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Stack(
                      children: [
                        if (_isProcessing) const Center(child: CircularProgressIndicator(color: Colors.white)),
                        Positioned(top: 0, left: 0, child: _corner(top: true, left: true)),
                        Positioned(top: 0, right: 0, child: _corner(top: true, left: false)),
                        Positioned(bottom: 0, left: 0, child: _corner(top: false, left: true)),
                        Positioned(bottom: 0, right: 0, child: _corner(top: false, left: false)),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _corner({required bool top, required bool left}) {
    return Container(
      width: 30,
      height: 30,
      decoration: BoxDecoration(
        border: Border(
          top: top ? const BorderSide(color: Colors.white, width: 4) : BorderSide.none,
          bottom: !top ? const BorderSide(color: Colors.white, width: 4) : BorderSide.none,
          left: left ? const BorderSide(color: Colors.white, width: 4) : BorderSide.none,
          right: !left ? const BorderSide(color: Colors.white, width: 4) : BorderSide.none,
        ),
      ),
    );
  }

  Widget _statItem(String label, int value, Color color) {
    return Column(
      children: [
        Text(value.toString(), style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: TextStyle(fontSize: 10, color: Colors.grey[600], fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _statusChip(String label, String value, Color color) {
    final isSelected = _selectedStatus == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (bool selected) { if (selected) setState(() => _selectedStatus = value); },
      selectedColor: color.withOpacity(0.2),
      labelStyle: TextStyle(color: isSelected ? color : Colors.grey[700], fontWeight: isSelected ? FontWeight.bold : FontWeight.normal),
    );
  }

  @override
  void dispose() {
    _cameraController.dispose();
    super.dispose();
  }
}

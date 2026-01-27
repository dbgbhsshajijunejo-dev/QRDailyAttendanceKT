
import 'dart:io';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:path_provider/path_provider.dart';
import 'logger_service.dart';

class ImageReportService {
  final _logger = LoggerService();

  /// Captures the widget attached to [key] and saves it as a PNG file.
  Future<String?> captureAndSaveReport(GlobalKey key, String fileName) async {
    try {
      // 1. Find the RenderObject
      RenderRepaintBoundary? boundary = key.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) throw Exception("Could not find RepaintBoundary");

      // 2. Convert to Image (High Pixel Ratio for clarity)
      ui.Image image = await boundary.toImage(pixelRatio: 3.0);
      var byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      
      if (byteData == null) throw Exception("Failed to convert image to bytes");
      final pngBytes = byteData.buffer.asUint8List();

      // 3. Save to Local Storage
      final directory = await getApplicationDocumentsDirectory();
      final String path = '${directory.path}/$fileName.png';
      final File imgFile = File(path);
      await imgFile.writeAsBytes(pngBytes);

      _logger.log("Image Report saved to: $path", level: LogLevel.info);
      return path;
    } catch (e) {
      _logger.log("Image Export Failed", level: LogLevel.error, error: e);
      return null;
    }
  }
}

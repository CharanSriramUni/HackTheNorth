import 'dart:typed_data';
import 'dart:ui' as ui;
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:google_mlkit_digital_ink_recognition/google_mlkit_digital_ink_recognition.dart';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:hackthenotes/providers/command_recognizer_provider.dart';
import 'package:hackthenotes/screens/image_screen.dart';
import 'package:hackthenotes/utils/colors.dart';
import 'package:hackthenotes/utils/style_constants.dart';
import 'package:ionicons/ionicons.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:bitmap/bitmap.dart';

import '../services/text_recognition_service.dart';

class ContentScreen extends StatefulWidget {
  const ContentScreen({super.key});

  @override
  State<ContentScreen> createState() => _ContentScreenState();
}

class _ContentScreenState extends State<ContentScreen> {
  List<Offset?> points = [];
  List<Offset?> circledPoints = [];
  var isUsingStylus = false;
  var circled = false;
  var xPadding = StyleConstants.width * 0.05;
  static const yPadding = 78.0;
  late WebViewController webViewController;

  final GlobalKey repaintBoundaryKey = GlobalKey();
  final platform = MethodChannel('com.example.screenshot_channel');

  @override
  void initState() {
    webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(TWColors.slate100)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading bar.
          },
          onPageStarted: (String url) {},
          onPageFinished: (String url) {},
          onWebResourceError: (WebResourceError error) {},
          onNavigationRequest: (NavigationRequest request) {
            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(
          'https://www.nytimes.com/2023/09/16/business/electric-vehicles-uaw-gm-ford-stellantis.html?unlocked_article_code=LbBkrpXQeRrFaUUNJCm85oNptoSBI8fAI6huOMqQadsL_BI46XqjB8VYxtwofVlkLToHT_Pt3FgI71Ti4cTrFgHLU0D0iUzjOXhOgnnmRMdhKX_wEVNHDGkJwTq5HMrDmNdK47KmgWSGFs_9SEybIdz6DFC3GmX_1L-MlgJSEQXqO4QlzzhDNRK4HJEf7weHS4yj2aaJ2oaPKkOcsD2Q7fCv20h6PhoTuO1YOnHLMlKQ4VS7ZDCGDWnMCwNgVl6klfmGgDjS1ykUNPzqS0VMRwRSGEglSWfB4PaydvlIpCWpBIEyL16ZDeZ7VBGj6h5MFMQosHv8D8rPyTH9gM8DuK5uDDTvcuDyxisCl_r-Ep8HZ54&smid=url-share'));
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    var recognizerProvider = context.watch<CommandRecognizerProvider>();

    return Scaffold(
      backgroundColor: TWColors.slate100,
      appBar: AppBar(
        title: const Text(
          'Annotation Mode',
          style: TextStyle(fontSize: 18.0, color: NotesColors.black),
        ),
        backgroundColor: NotesColors.white,
        toolbarHeight: 56.0,
        actions: [
          IconButton(
            onPressed: () {
              setState(() {
                points.clear();
                circledPoints.clear();
                isUsingStylus = !isUsingStylus;
                circled = false;
              });
            },
            icon: isUsingStylus
                ? const Icon(Ionicons.pencil_outline, color: NotesColors.black)
                : const Icon(Ionicons.hand_right_outline,
                    color: NotesColors.black),
          ),
        ],
        elevation: 0,
      ),
      body: Padding(
        padding: EdgeInsets.symmetric(horizontal: StyleConstants.width * 0.05),
        child: Container(
          decoration: BoxDecoration(
            boxShadow: [
              BoxShadow(
                color: TWColors.gray500.withOpacity(0.2),
                spreadRadius: 5,
                blurRadius: 7,
                // offset: Offset(0, 3),
              ),
            ],
          ),
          child: Stack(
            children: [
              RepaintBoundary(
                  key: repaintBoundaryKey,
                  child: WebViewWidget(controller: webViewController)),
              if (isUsingStylus)
                GestureDetector(
                  behavior: HitTestBehavior.translucent,
                  onPanStart: (details) {
                    if (circled) {
                      recognizerProvider.ink.strokes.add(Stroke());
                    }
                  },
                  onPanUpdate: (details) {
                    setState(() {
                      points.add(details.localPosition);

                      if (circled) {
                        final RenderObject? object = context.findRenderObject();
                        final localPosition = (object as RenderBox?)
                            ?.globalToLocal(details.localPosition);
                        if (localPosition != null) {
                          recognizerProvider.points =
                              List.from(recognizerProvider.points)
                                ..add(StrokePoint(
                                  x: localPosition.dx,
                                  y: localPosition.dy,
                                  t: DateTime.now().millisecondsSinceEpoch,
                                ));
                        }
                        if (recognizerProvider.ink.strokes.isNotEmpty) {
                          recognizerProvider.ink.strokes.last.points =
                              recognizerProvider.points.toList();
                        }
                      }
                    });
                  },
                  onPanEnd: (details) async {
                    points.add(null);
                    if (circled) {
                      recognizerProvider.points.clear();
                      recognizerProvider.recognizeText();
                    } else {
                      circledPoints = [...points];
                      Rect largest = findLargestCircumscribedRectangle(circledPoints);
                      var bytes = await capture(largest);
                      var recognizedText = await TextRecognitionService.recognizeText(bytes!);
                      print(recognizedText);
                      Navigator.push(
                        context,
                        MaterialPageRoute<void>(
                          builder: (BuildContext ctx) => ImageScreen(
                            imageBytes: bytes,
                          ),
                        ),
                      );
                      circled = true;
                    }

                  },
                  child: CustomPaint(
                    painter: NotePainter(points),
                    child: Container(
                      width: MediaQuery.of(context).size.width,
                      height: MediaQuery.of(context).size.height,
                    ),
                  ),
                )
            ],
          ),
        ),
      ),
    );
  }

  Rect findLargestCircumscribedRectangle(List<Offset?> offsets) {
    if (offsets.isEmpty) {
      throw ArgumentError('The offsets list should not be empty.');
    }

    double minX = double.infinity;
    double minY = double.infinity;
    double maxX = -double.infinity;
    double maxY = -double.infinity;

    for (var offset in offsets) {
      if (offset != null) {
        minX = min(minX, offset.dx);
        minY = min(minY, offset.dy);
        maxX = max(maxX, offset.dx);
        maxY = max(maxY, offset.dy);
      }
    }

    minX += StyleConstants.width * 0.05;
    maxX += StyleConstants.width * 0.05;
    minY += 78.0;
    maxY += 78.0;

    print("found ${minX} ${minY} ${maxX} ${maxY}");

    return Rect.fromLTRB(minX, minY, maxX, maxY);
  }

  Future<Uint8List?> capture(Rect rect) async {
    print("${rect.left} ${rect.top} ${rect.width} ${rect.height}");
    try {
      final List<dynamic> bytes =
          await platform.invokeMethod('captureScreenshot', {
        'x': rect.left,
        'y': rect.top,
        'width': rect.width,
        'height': rect.height,
      });
      var intBytes = bytes.cast<int>();
      Uint8List byteList = Uint8List.fromList(intBytes);
      return byteList;
    } on PlatformException catch (e) {
      print(e.message);
      return null;
    }
  }

  // Future<Uint8List?> captureRectangle(Rect captureRect) async {
  //   try {
  //     RenderRepaintBoundary boundary = repaintBoundaryKey.currentContext!
  //         .findRenderObject() as RenderRepaintBoundary;
  //     ui.Image fullImage = await boundary.toImage(pixelRatio: 1.0);

  //     // Crop the image
  //     final recorder = ui.PictureRecorder();
  //     final canvas = Canvas(
  //         recorder,
  //         Rect.fromPoints(
  //             Offset(0, 0), captureRect.bottomRight - captureRect.topLeft));
  //     canvas.drawImageRect(
  //         fullImage,
  //         captureRect,
  //         Rect.fromPoints(
  //             Offset(0, 0), captureRect.size.bottomRight(Offset.zero)),
  //         Paint());

  //     final picture = recorder.endRecording();
  //     final croppedImage = await picture.toImage(
  //         captureRect.width.toInt(), captureRect.height.toInt());

  //     ByteData? byteData =
  //         await croppedImage.toByteData(format: ui.ImageByteFormat.png);
  //     if (byteData != null) {
  //       return byteData.buffer.asUint8List();
  //     }
  //   } catch (e) {
  //     print(e);
  //   }
  //   return null;
  // }
}

class NotePainter extends CustomPainter {
  final List<Offset?> points;

  NotePainter(this.points);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 5.0;

    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return true;
  }
}
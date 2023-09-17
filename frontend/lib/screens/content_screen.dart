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
import 'package:hackthenotes/services/api_service.dart';
import 'package:hackthenotes/widgets/lookup_dialog.dart';
import 'package:hackthenotes/utils/colors.dart';
import 'package:hackthenotes/utils/style_constants.dart';
import 'package:ionicons/ionicons.dart';
import 'package:provider/provider.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:bitmap/bitmap.dart';

import '../providers/ws_listener_provider.dart';
import '../services/text_recognition_service.dart';

class ContentScreen extends StatefulWidget {
  const ContentScreen({super.key});

  @override
  State<ContentScreen> createState() => _ContentScreenState();
}

class _ContentScreenState extends State<ContentScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController animationController;

  List<Offset?> points = [];
  List<Offset?> circledPoints = [];
  var isUsingStylus = false;
  var circled = false;
  var xPadding = StyleConstants.width * 0.05;
  static const yPadding = 78.0;
  late WebViewController webViewController;

  final GlobalKey repaintBoundaryKey = GlobalKey();
  final platform = MethodChannel('com.example.screenshot_channel');

  int age = 0;
  List<IconData> ageIcons = [
    Icons.child_friendly_outlined,
    Icons.school_outlined,
    Icons.work_outline,
  ];

  @override
  void initState() {
    animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(TWColors.slate100)
      ..setNavigationDelegate(
        NavigationDelegate(
            // onProgress: (int progress) async {
            //   // Update loading bar.
            //   if(progress == 100) {
            //     await Future.delayed(Duration(milliseconds: 100));
            //
            //   }
            // },
            ),
      );
    super.initState();
  }

  @override
  Future<void> didChangeDependencies() async {
    super.didChangeDependencies();
    await webViewController
        .loadHtmlString(Provider.of<WSListenerProvider>(context).document)
        .whenComplete(() async {
      Offset offset =
          Provider.of<WSListenerProvider>(context, listen: false).offset;
      await Future.delayed(Duration(milliseconds: 100));
      await webViewController.scrollTo(offset.dx.floor(), offset.dy.floor());
      await Future.delayed(Duration(milliseconds: 200));
      setState(() {
        points.clear();
        circledPoints.clear();
        isUsingStylus = false;
        circled = false;
      });
    });
  }

  @override
  void dispose() {
    animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    var recognizerProvider = context.read<CommandRecognizerProvider>();
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
                age = (age + 1) % 3;
                recognizerProvider.age = age;
              });
            },
            icon: Icon(ageIcons[age], color: NotesColors.black),
          ),
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
        leading: IconButton(
          icon: const Icon(
            Ionicons.chevron_back_outline,
            color: NotesColors.black,
          ),
          onPressed: () {
            // context.read<WSListenerProvider>().updateDocument('');
            APIService.clearDoc();
          },
        ),
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
                    showInfoDialog(Container());
                    if (circled) {
                      recognizerProvider.points.clear();
                      Provider.of<WSListenerProvider>(context, listen: false)
                          .setOffset(webViewController.getScrollPosition());
                      await recognizerProvider.recognizeText();
                    } else {
                      circledPoints = [...points];
                      Rect largest =
                          findLargestCircumscribedRectangle(circledPoints);
                      var bytes = await capture(largest);
                      if (bytes != null) {
                        var recognizedText =
                            await TextRecognitionService.recognizeText(bytes!);
                        print(recognizedText);
                        Provider.of<CommandRecognizerProvider>(context,
                                listen: false)
                            .circledText = recognizedText;
                        circled = true;
                      }
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

  void showInfoDialog(Widget widget) {
    OverlayEntry overlayEntry = OverlayEntry(
      builder: (context) => ScaleTransition(
        scale: Tween(begin: 0.0, end: 1.0).animate(CurvedAnimation(
          parent: animationController,
          curve: Curves.elasticOut,
        )),
        child: LookupDialog(
            content: Column(
              children: [
                Text(
                    "This is an example of a long text. It can span multiple lines."),
                Image.network('https://example.com/path/to/your/image.png'),
                Text("Another piece of text."),
              ],
            ),
            targetPosition: Offset(100, 200) // adjust the position as needed
            ),
      ),
    );

    Overlay.of(context).insert(overlayEntry);
  }
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

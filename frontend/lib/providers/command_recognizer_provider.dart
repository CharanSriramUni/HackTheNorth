import 'package:flutter/foundation.dart';
import 'package:google_mlkit_digital_ink_recognition/google_mlkit_digital_ink_recognition.dart';

import '../services/api_service.dart';

class CommandRecognizerProvider extends ChangeNotifier {
  String circledText = "";
  final List<String> commands = ['summarize', 'context', 'visualize'];

  final String language = 'en-US';
  late final DigitalInkRecognizer digitalInkRecognizer =
      DigitalInkRecognizer(languageCode: language);
  final Ink ink = Ink();
  List<StrokePoint> points = [];
  String recognizedText = '';
  int age = 0;

  void clearPad() {
    ink.strokes.clear();
    points.clear();
    recognizedText = '';
    notifyListeners();
  }

  Future<void> recognizeText() async {
    try {
      final candidates = await digitalInkRecognizer.recognize(ink);
      candidates.sort((a, b) => a.score - b.score > 0 ? 1 : -1);
      recognizedText = candidates.first.text;
      print(recognizedText);
      String command = commands.singleWhere(
          (command) => recognizedText
              .toLowerCase()
              .replaceAll(' ', '')
              .contains(command),
          orElse: () => '');
      if (command.isNotEmpty) {
        // run command
        if (command == "summarize") {
          print("summarizing...");
          APIService.summarize(circledText);
        }

        clearPad();
      }
    } catch (e) {
      print(e);
    }
  }
}

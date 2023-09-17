import 'dart:io';
import 'dart:ui';
import 'dart:typed_data';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image/image.dart';
class TextRecognitionService {
  static final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);

  static Future<String> getTemporaryFilePath(String fileExtension) async {
    final tempDirectory = Directory.systemTemp;
    final tempFileName = DateTime.now().millisecondsSinceEpoch.toString();
    final tempFilePath = '${tempDirectory.path}/$tempFileName.$fileExtension';
    return tempFilePath;
  }

  static Future<String> recognizeText(Uint8List image) async {
    final File file = File(await getTemporaryFilePath("selectedImage"));
    await file.writeAsBytes(image, flush: true);
    InputImage inputImage = InputImage.fromFile(file);
    final RecognizedText recognizedText = await textRecognizer.processImage(inputImage);

    String text = recognizedText.text;
    return text;
  }
}
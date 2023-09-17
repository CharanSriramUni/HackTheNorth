import 'dart:io';
import 'dart:ui';
import 'dart:typed_data';
import 'package:google_mlkit_text_recognition/google_mlkit_text_recognition.dart';
import 'package:image/image.dart';
class TextRecognitionService {
  static final textRecognizer = TextRecognizer(script: TextRecognitionScript.latin);
  static Future<String> recognizeText(Uint8List image) async {
    Image decodedImage = decodeImage(image)!;

    InputImageRotation rotation = InputImageRotation.rotation0deg!;

    const format = InputImageFormat.bgra8888;
    final int bytesPerRow = decodedImage.width * 3;

    final InputImage inputImage = InputImage.fromBytes(
        bytes: image,
        metadata: InputImageMetadata(size: Size(decodedImage.width.toDouble(), decodedImage.height.toDouble()),
            rotation: rotation, format: format, bytesPerRow: bytesPerRow));
    final RecognizedText recognizedText = await textRecognizer.processImage(inputImage);

    String text = recognizedText.text;

    return text;
  }
}
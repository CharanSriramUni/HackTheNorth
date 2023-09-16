import 'package:flutter/foundation.dart';

class DocumentProvider extends ChangeNotifier {
  String _document = '';

  String get document => _document;

  void updateDocument(String newDocument) {
    _document = newDocument;
    notifyListeners();
  }
}
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WSListenerProvider extends ChangeNotifier {
  static const webSocketURL = 'wss://wet-memes-decide.tunnelapp.dev/ws/';
  late WebSocketChannel _channel;

  String _document = '';

  String get document => _document;

  Offset _offset = const Offset(0,0);

  Offset get offset => _offset;

  WSListenerProvider() {
    _channel = WebSocketChannel.connect(
      Uri.parse(webSocketURL),
    );
    listenToStream();
  }

  Future<void> listenToStream() async {
    _channel.stream.listen((document) {
      updateDocument(document);
      notifyListeners();
    });
  }

  Future<void> setOffset(Future<Offset> input) async {
    _offset = await input;
  }
  void updateDocument(String newDocument) {
    _document = newDocument;
  }
}

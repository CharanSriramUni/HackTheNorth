import 'dart:async';
import 'dart:ui';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WSListenerProvider extends ChangeNotifier {
  static const webSocketURL = 'wss://wet-memes-decide.tunnelapp.dev/ws/';
  late WebSocketChannel _channel;
  Timer? _reconnectTimer;
  int _retryCount = 0;
  final int _maxRetryCount = 10;

  String _document = '';

  String get document => _document;

  Offset _offset = const Offset(0, 0);

  Offset get offset => _offset;

  WSListenerProvider() {
    connect();
  }

  connect() async {
    print("connecting");
    _channel = WebSocketChannel.connect(
      Uri.parse(webSocketURL),
    );
    listenToStream();
  }

  Future<void> listenToStream() async {
    _channel.stream.listen(
      (document) {
        updateDocument(document);
        notifyListeners();
      },
      onDone: () {
        debugPrint('ws channel closed');
        handleDisconnect();
      },
      onError: (error) {
        debugPrint('ws error $error');
        handleDisconnect();
      },
    );
  }

  handleDisconnect() {
    if (_retryCount < _maxRetryCount) {
      _retryCount++;
      final duration =
          Duration(seconds: 2 * _retryCount); // Exponential backoff
      _reconnectTimer = Timer(duration, () {
        _reconnectTimer?.cancel();
        connect();
      });
    } else {
      print("Max retry count reached. Not reconnecting.");
    }
  }

  Future<void> setOffset(Future<Offset> input) async {
    _offset = await input;
  }

  void updateDocument(String newDocument) {
    _document = newDocument;
  }
}

import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class WSListenerProvider extends ChangeNotifier {
  static const webSocketURL = 'wss://echo.websocket.events';
  late WebSocketChannel _channel;

  WSListenerProvider() {
    _channel = WebSocketChannel.connect(
      Uri.parse(webSocketURL),
    );

    listenToStream();
  }

  Future<void> listenToStream() async {
    _channel.stream.listen((event) {
      print(event);
      notifyListeners();
    });
  }
}

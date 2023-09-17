import 'package:flutter/material.dart';
import 'package:hackthenotes/providers/ws_listener_provider.dart';
import 'package:hackthenotes/screens/content_screen.dart';
import 'package:hackthenotes/screens/upload_screen.dart';
import 'package:hackthenotes/utils/style_constants.dart';
import 'package:provider/provider.dart';

class RootScreen extends StatelessWidget {
  const RootScreen({super.key});

  @override
  Widget build(BuildContext context) {
    if (!StyleConstants.initialized) {
      StyleConstants().init(context);
    }

    var documentProvider = context.watch<WSListenerProvider>();
    if (documentProvider.document.isEmpty) {
      return UploadScreen();
    }
    return const ContentScreen();
  }
}

import 'package:flutter/material.dart';
import 'package:hackthenotes/screens/upload_screen.dart';
import 'package:hackthenotes/utils/style_constants.dart';

class RootScreen extends StatelessWidget {
  const RootScreen({super.key});

  @override
  Widget build(BuildContext context) {
    if (!StyleConstants.initialized) {
      StyleConstants().init(context);
    }

    return UploadScreen();
  }
}

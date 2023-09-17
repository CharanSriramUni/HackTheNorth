import 'dart:typed_data';

import 'package:flutter/material.dart';

class ImageScreen extends StatelessWidget {
  const ImageScreen({super.key, this.imageBytes});
  final Uint8List? imageBytes;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: Center(
          child: imageBytes != null
              ? Image.memory(imageBytes!)
              : Text("no image")),
    );
  }
}

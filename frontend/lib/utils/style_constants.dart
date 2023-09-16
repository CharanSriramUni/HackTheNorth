import 'package:flutter/material.dart';

class StyleConstants {
  static late MediaQueryData _mediaQueryData;
  static bool initialized = false;

  //for iPhone SE2 - 647.0 and 375.0
  static late double height;
  static late double width;

  void init(BuildContext context) {
    initialized = true;
    _mediaQueryData = MediaQuery.of(context);
    height = _mediaQueryData.size.height;
    width = _mediaQueryData.size.width;
  }
}

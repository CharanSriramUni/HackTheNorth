import 'package:flutter/material.dart';

class LookupDialog extends StatelessWidget {
  final Widget content;  // This can be a combination of Text, Image, etc.
  final Offset targetPosition;

  LookupDialog({required this.content, required this.targetPosition});

  @override
  Widget build(BuildContext context) {
    return Positioned(
      left: targetPosition.dx,
      top: targetPosition.dy,
      child: CustomPaint(
        painter: BubblePainter(),
        child: Container(
          width: 300, // adjust as needed
          height: 200, // adjust as needed
          padding: EdgeInsets.all(10),
          child: SingleChildScrollView(child: content), 
        ),
      ),
    );
  }
}

class BubblePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final Paint paint = Paint()..color = Colors.white;
    final path = Path()
      ..lineTo(0, size.height)
      ..quadraticBezierTo(size.width / 2, size.height + 10, size.width, size.height) // Pointy bit
      ..lineTo(size.width, 0)
      ..close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) {
    return false;
  }
}

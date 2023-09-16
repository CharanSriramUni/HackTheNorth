import 'package:flutter/material.dart';
import 'package:hackthenotes/providers/document_provider.dart';
import 'package:hackthenotes/providers/ws_listener_provider.dart';
import 'package:hackthenotes/screens/root_screen.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<DocumentProvider>(
          create: (context) => DocumentProvider(),
        ),
        ChangeNotifierProvider<WSListenerProvider>(
          create: (context) => WSListenerProvider(),
        ),
      ],
      child: const MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Notes',
        home: RootScreen(),
      ),
    );
  }
}

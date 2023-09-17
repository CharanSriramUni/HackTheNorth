import 'package:flutter/material.dart';
import 'package:google_mlkit_digital_ink_recognition/google_mlkit_digital_ink_recognition.dart';
import 'package:hackthenotes/providers/command_recognizer_provider.dart';
import 'package:hackthenotes/providers/document_provider.dart';
import 'package:hackthenotes/providers/ws_listener_provider.dart';
import 'package:hackthenotes/screens/root_screen.dart';
import 'package:provider/provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  bool verify = await DigitalInkRecognizerModelManager().downloadModel("en-US");
  print(verify);
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
        ChangeNotifierProvider<CommandRecognizerProvider>(
          create: (context) => CommandRecognizerProvider(),
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

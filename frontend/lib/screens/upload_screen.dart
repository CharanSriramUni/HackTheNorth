import 'package:flutter/material.dart';
import 'package:hackthenotes/utils/colors.dart';
import 'package:ionicons/ionicons.dart';

class UploadScreen extends StatelessWidget {
  UploadScreen({super.key});

  final TextEditingController _urlController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            "NOTES NOTES NOTES",
            style: TextStyle(fontSize: 36.0),
          ),
          TextField(
            controller: _urlController,
            decoration: const InputDecoration(
                hintStyle: TextStyle(
                  fontSize: 20.0,
                  fontWeight: FontWeight.w400,
                  fontFamily: 'Nunito',
                  color: TWColors.gray500,
                ),
                fillColor: TWColors.gray100,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.all(
                    Radius.circular(10.0),
                  ),
                  borderSide: BorderSide.none,
                ),
                hintText: "Enter a Website"),
          ),
          const Text(
            "OR",
            style: TextStyle(fontSize: 36.0),
          ),
          ElevatedButton(
            onPressed: () {},
            child: Row(
              children: [
                Icon(Ionicons.cloud_upload_outline),
                Text("Upload a Document")
              ],
            ),
            
          ),
        ],
      ),
    );
  }
}

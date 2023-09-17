import 'package:flutter/material.dart';
import 'package:hackthenotes/utils/colors.dart';
import 'package:hackthenotes/utils/style_constants.dart';
import 'package:ionicons/ionicons.dart';

import '../services/api_service.dart';

class UploadScreen extends StatelessWidget {
  UploadScreen({super.key});

  final TextEditingController _urlController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    var width = StyleConstants.width;
    var height = StyleConstants.height;
    return Scaffold(
      body: Column(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          const Text(
            "NOTES NOTES NOTES",
            style: TextStyle(fontSize: 36.0),
          ),
          SizedBox(
            width: width,
            height: height * 0.3,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                SizedBox(
                  width: width * 0.8,
                  child: TextField(
                    onSubmitted: (value) async {
                      // make api call
                      APIService.sendURL(value);
                    },
                    controller: _urlController,
                    decoration: InputDecoration(
                      hintStyle: const TextStyle(
                        fontSize: 20.0,
                        fontWeight: FontWeight.w400,
                        fontFamily: 'Nunito',
                        color: TWColors.gray500,
                      ),
                      filled: true,
                      fillColor: TWColors.gray100,
                      border: const OutlineInputBorder(
                        borderRadius: BorderRadius.all(
                          Radius.circular(10.0),
                        ),
                        borderSide: BorderSide.none,
                      ),
                      hintText: "Enter a Website",
                      contentPadding: EdgeInsets.symmetric(
                        vertical: height * 0.015,
                        horizontal: width * 0.03,
                      ),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const Text(
                  "or",
                  style: TextStyle(
                    fontSize: 24.0,
                    color: TWColors.gray500,
                  ),
                ),
                SizedBox(
                  width: width * 0.8,
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: TWColors.gray100,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(
                          20,
                        ),
                      ),
                      padding: EdgeInsets.symmetric(
                        horizontal: width * 0.01,
                        vertical: height * 0.015,
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Ionicons.cloud_upload_outline,
                          color: TWColors.gray500,
                        ),
                        SizedBox(
                          width: width * 0.01,
                        ),
                        const Text(
                          "Upload a Document",
                          style: TextStyle(
                            fontSize: 20.0,
                            fontWeight: FontWeight.w400,
                            fontFamily: 'Nunito',
                            color: TWColors.gray500,
                          ),
                        )
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

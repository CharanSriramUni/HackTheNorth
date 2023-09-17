import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
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
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              image: DecorationImage(
                image: AssetImage('assets/background.jpeg'),
                fit: BoxFit.cover,
              ),
            ),
          ),
          SingleChildScrollView(
            child: SizedBox(
              width: width,
              height: height,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  Expanded(
                    flex: 5,
                    child: Padding(
                      padding: EdgeInsets.only(
                        left: width * 0.2,
                        right: width * 0.2,
                        top: height * 0.04,
                      ),
                      child: SvgPicture.asset('assets/notes.svg'),
                    ),
                  ),
                  Expanded(
                    flex: 4,
                    child: Padding(
                      padding: EdgeInsets.symmetric(horizontal: width * 0.08),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          Column(
                            children: [
                              const Text(
                                'Welcome to InkQuery',
                                style: TextStyle(
                                  fontSize: 44.0,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'Nunito',
                                  color: NotesColors.black,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              SizedBox(
                                height: height * 0.01,
                              ),
                              const Text(
                                'AI-Powered Annotations for Smarter Browsing',
                                style: TextStyle(
                                  fontSize: 28.0,
                                  fontWeight: FontWeight.w300,
                                  fontFamily: 'Nunito',
                                  color: NotesColors.black,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                          Column(
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
                                        Radius.circular(20.0),
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
                              SizedBox(
                                height: height * 0.02,
                              ),
                              const Text(
                                "or",
                                style: TextStyle(
                                  fontSize: 24.0,
                                  color: TWColors.gray500,
                                ),
                              ),
                              SizedBox(
                                height: height * 0.02,
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
                          )
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

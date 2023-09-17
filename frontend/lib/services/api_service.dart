import 'package:dio/dio.dart';
import 'package:http/http.dart';
import 'package:provider/provider.dart';

class APIService {
  static const endPoint = "https://curvy-plums-write.tunnelapp.dev";
  static Future<void> sendURL(String url) async {
    const String apiURL = "$endPoint/init-document";
    try {
      final response = await get(
        Uri.parse("$apiURL?url=$url"),
      );
    } catch (e) {}
  }

  static Future<void> clearDoc() async {
    const String apiURL = "$endPoint/clear-document";
    try {
      final response = await get(
        Uri.parse("$apiURL"),
      );
    } catch (e) {}
  }

  static Future<void> summarize(String text) async {
    const String apiURL = "$endPoint/summarize";
    final Map<String, dynamic> requestBody = {
      'selected_text': text,
    };
    try {
      final response = await post(Uri.parse(apiURL), body: requestBody);
    } catch (e) {}
  }

  static Future<void> context(String text) async {
    const String apiURL = "$endPoint/context";
    final Map<String, dynamic> requestBody = {
      'selected_text': text,
    };
    try {
      final response = await post(
          Uri.parse(apiURL),
          body: requestBody
      );
    } catch (e) {

    }
  }

  static Future<void> visualize(String text) async {
    const String apiURL = "$endPoint/visualize";
    final Map<String, dynamic> requestBody = {
      'selected_text': text,
    };
    try {
      final response = await post(
          Uri.parse(apiURL),
          body: requestBody
      );
    } catch (e) {

    }
  }

  static Future<void> question(String text, String question) async {
    const String apiURL = "$endPoint/question";
    final Map<String, dynamic> requestBody = {
      'selected_text': text,
      'question': question
    };
    try {
      final response = await post(
          Uri.parse(apiURL),
          body: requestBody
      );
    } catch (e) {

    }
  }
}

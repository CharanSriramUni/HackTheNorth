import UIKit
import Flutter

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)

    let controller : FlutterViewController = window?.rootViewController as! FlutterViewController
    let screenshotChannel = FlutterMethodChannel(name: "com.example.screenshot_channel",
                                                 binaryMessenger: controller.binaryMessenger)
    screenshotChannel.setMethodCallHandler({
      (call: FlutterMethodCall, result: @escaping FlutterResult) -> Void in
      if call.method == "captureScreenshot" {
        guard let args = call.arguments as? [String: CGFloat] else {
          return
        }

        print("Received arguments:", args)

        let x = args["x"] ?? 0
        let y = args["y"] ?? 0
        let width = args["width"] ?? 0
        let height = args["height"] ?? 0

        print("Received arguments - x: \(x), y: \(y), width: \(width), height: \(height)")
        
        let rect = CGRect(x: x, y: y, width: width, height: height)
        self.capture(rect: rect, result: result)
      }
    })

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  private func capture(rect: CGRect, result: @escaping FlutterResult) {
    let renderer = UIGraphicsImageRenderer(size: rect.size)
    let image = renderer.image { ctx in
      UIApplication.shared.windows.first?.layer.render(in: ctx.cgContext)
    }
    
    if let data = image.pngData() {
        result([UInt8](data))
    } else {
        result(FlutterError(code: "UNAVAILABLE",
                            message: "Failed to capture screenshot",
                            details: nil))
    }
  }
}

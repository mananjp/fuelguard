import 'package:get/get.dart';
import '../../../routes/app_routes.dart';

class StartTripController extends GetxController {
  final destination = "".obs;
  final estimatedTime = "4h 30m".obs;
  final distance = "280 km".obs;
  
  final checklist = <String, bool>{
    "Vehicle Inspection Completed": false,
    "Tire Pressure Checked": false,
    "Fuel Levels Verified": false,
    "Emergency Kit Present": false,
  }.obs;

  bool get isChecklistComplete => checklist.values.every((v) => v);

  void toggleCheck(String item) {
    checklist[item] = !checklist[item]!;
  }

  void startTrip() {
    if (!isChecklistComplete) {
      Get.snackbar("Safety First", "Please complete the pre-trip checklist.");
      return;
    }
    // Logic to start trip
    Get.offAllNamed(Routes.DASHBOARD);
  }
}

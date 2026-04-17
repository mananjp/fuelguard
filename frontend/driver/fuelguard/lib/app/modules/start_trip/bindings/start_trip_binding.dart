import 'package:get/get.dart';
import '../controllers/start_trip_controller.dart';

class StartTripBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<StartTripController>(() => StartTripController());
  }
}

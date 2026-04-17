import 'package:get/get.dart';
import '../controllers/trip_history_controller.dart';

class TripHistoryBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<TripHistoryController>(() => TripHistoryController());
  }
}

import 'package:get/get.dart';
import '../controllers/main_controller.dart';
import '../../dashboard/controllers/dashboard_controller.dart';
import '../../start_trip/controllers/start_trip_controller.dart';
import '../../trip_history/controllers/trip_history_controller.dart';
import '../../fuel_upload/controllers/fuel_upload_controller.dart';
import '../../sos/controllers/sos_controller.dart';

class MainBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<MainController>(() => MainController());
    Get.lazyPut<DashboardController>(() => DashboardController());
    Get.lazyPut<StartTripController>(() => StartTripController());
    Get.lazyPut<TripHistoryController>(() => TripHistoryController());
    Get.lazyPut<FuelUploadController>(() => FuelUploadController());
    Get.lazyPut<SOSController>(() => SOSController());
  }
}

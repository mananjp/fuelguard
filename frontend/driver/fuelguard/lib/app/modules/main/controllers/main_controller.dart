import 'package:get/get.dart';
import '../../dashboard/views/dashboard_view.dart';
import '../../start_trip/views/start_trip_view.dart';
import '../../trip_history/views/trip_history_view.dart';
import '../../fuel_upload/views/fuel_upload_view.dart';
import '../../sos/views/sos_view.dart';

class MainController extends GetxController {
  final currentIndex = 0.obs;

  final pages = [
    const DashboardView(),
    const TripHistoryView(),
    const StartTripView(), // This can be reached via center button or tab
    const FuelUploadView(),
    const SOSView(),
  ];

  void changePage(int index) {
    currentIndex.value = index;
  }
}

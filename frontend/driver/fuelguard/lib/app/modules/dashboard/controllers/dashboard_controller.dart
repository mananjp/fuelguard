import 'package:get/get.dart';

class DashboardController extends GetxController {
  final driverName = "John Doe".obs;
  final truckId = "Truck-742".obs;
  final tripStatus = "Active".obs;

  final fuelEfficiency = 3.2.obs;
  final totalDistance = 12450.obs;
  final nextMaintenance = "450 km".obs;

  final isLoading = false.obs;

  @override
  void onInit() {
    super.onInit();
    // Fetch initial data
  }

  void startNewTrip() {
    // Navigate to start trip
  }
}

import 'package:get/get.dart';
import '../../../routes/app_routes.dart';

class FuelUploadController extends GetxController {
  final isUploading = false.obs;
  final isVerifying = false.obs;

  Future<void> uploadReceipt() async {
    isUploading.value = true;
    // Simulate upload
    await Future.delayed(const Duration(seconds: 1));
    isUploading.value = false;
    
    Get.toNamed(Routes.FUEL_RESULT); // In a real app, go to verification first
  }
}

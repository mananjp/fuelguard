import 'package:get/get.dart';
import '../../../routes/app_routes.dart';

class AIVerificationController extends GetxController {
  final verificationStatus = "Analyzing receipt...".obs;
  final progress = 0.0.obs;

  @override
  void onInit() {
    super.onInit();
    startAIVerification();
  }

  Future<void> startAIVerification() async {
    progress.value = 0.2;
    await Future.delayed(const Duration(seconds: 2));
    progress.value = 0.5;
    verificationStatus.value = "Scanning for anomalies...";
    await Future.delayed(const Duration(seconds: 2));
    progress.value = 0.8;
    verificationStatus.value = "Matching with GPS logs...";
    await Future.delayed(const Duration(seconds: 2));
    progress.value = 1.0;
    Get.toNamed(Routes.FUEL_RESULT);
  }
}

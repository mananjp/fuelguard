import 'package:get/get.dart';
import '../controllers/ai_verification_controller.dart';

class AIVerificationBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<AIVerificationController>(() => AIVerificationController());
  }
}

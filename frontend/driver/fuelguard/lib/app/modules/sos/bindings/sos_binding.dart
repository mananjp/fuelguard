import 'package:get/get.dart';
import '../controllers/sos_controller.dart';

class SOSBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<SOSController>(() => SOSController());
  }
}

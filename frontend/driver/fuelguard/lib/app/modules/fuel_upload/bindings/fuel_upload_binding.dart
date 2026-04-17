import 'package:get/get.dart';
import '../controllers/fuel_upload_controller.dart';

class FuelUploadBinding extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<FuelUploadController>(() => FuelUploadController());
  }
}

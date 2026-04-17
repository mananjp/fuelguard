import 'package:flutter/material.dart';
import 'package:get/get.dart';

class SOSController extends GetxController {
  final isDispatched = false.obs;

  void triggerSOS() async {
    isDispatched.value = true;
    Get.snackbar(
      "SOS Sent", 
      "Emergency services have been notified.",
      snackPosition: SnackPosition.TOP, 
      backgroundColor: const Color(0xFFEF4444), 
      colorText: const Color(0xFFFFFFFF),
    );
  }
}

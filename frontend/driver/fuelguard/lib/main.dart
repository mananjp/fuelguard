import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'app/core/app_theme.dart';
import 'app/routes/app_pages.dart';

void main() {
  runApp(
    GetMaterialApp(
      title: "FuelGuard Driver",
      initialRoute: AppPages.INITIAL,
      getPages: AppPages.routes,
      theme: AppTheme.light,
      debugShowCheckedModeBanner: false,
    ),
  );
}

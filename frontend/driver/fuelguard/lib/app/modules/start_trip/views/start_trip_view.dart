import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/app_colors.dart';
import '../controllers/start_trip_controller.dart';

class StartTripView extends GetView<StartTripController> {
  const StartTripView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.slate600),
          onPressed: () => Get.back(),
        ),
        title: const Text(
          "Start Trip",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A)),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Ready to roll?",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0F172A), letterSpacing: -0.5),
              ),
              const SizedBox(height: 8),
              Text(
                "Please confirm your vehicle and current location details before starting your journey.",
                style: TextStyle(fontSize: 14, color: AppColors.slate600, height: 1.5),
              ),
              const SizedBox(height: 32),
              
              // Truck ID Input
              const Text(
                "Truck ID",
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
              ),
              const SizedBox(height: 8),
              TextField(
                decoration: InputDecoration(
                  hintText: "Enter Truck ID (e.g. TR-204)",
                  hintStyle: TextStyle(color: AppColors.slate400, fontSize: 14),
                  prefixIcon: const Icon(Icons.local_shipping_outlined, color: AppColors.slate400),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.slate200),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide(color: AppColors.slate200),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: AppColors.primary, width: 2),
                  ),
                ),
              ),
              
              const SizedBox(height: 24),
              
              // Location Card
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.slate200),
                ),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.location_on, color: AppColors.primary, size: 20),
                              const SizedBox(width: 8),
                              const Text(
                                "Current Location",
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF334155)),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(999)),
                            child: const Text("GPS ACTIVE", style: TextStyle(color: Color(0xFF15803D), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    Container(
                      height: 160,
                      width: double.infinity,
                      decoration: const BoxDecoration(
                        image: DecorationImage(
                          image: NetworkImage("https://lh3.googleusercontent.com/aida-public/AB6AXuAo-HBknawxYH0A6A-bLUKEYsqOdhNgd3lAUWFjhP_ZGw-kF7TJ_er6N5RDlu52FqgjCchsh16IE6wSaIq51tR-R-oAg09H6epbnTiDYCp51iVCjiZtco76ucWr9N-w4_epZy5Q9ahbx5aD1JQT6wCBW5m41cl7BFaoalpFRk9qiVcqYw5uggQcaYEEgbwgFnaBztRxGM7-szszldp5OJ0Vs8d6WAv9r_-Ob433X7SwvRQWsLLB4Cb6CP9qA2KKoEosvB2dBecLEvr4"),
                          fit: BoxFit.cover,
                          opacity: 0.8,
                        ),
                      ),
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                          child: Container(width: 12, height: 12, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(16),
                      color: AppColors.backgroundLight.withOpacity(0.5),
                      width: double.infinity,
                      child: const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Logistics Hub East, Gate 4", style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: Color(0xFF0F172A))),
                          SizedBox(height: 4),
                          Text("Chicago, IL • 41.8781° N, 87.6298° W", style: TextStyle(fontSize: 12, color: AppColors.slate500)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 48),

              // Start Trip Button
              ElevatedButton(
                onPressed: () => controller.startTrip(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 4,
                  shadowColor: AppColors.primary.withOpacity(0.2),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.play_circle_filled, color: Colors.white, size: 24),
                    SizedBox(width: 12),
                    Text("Start Trip", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  "By starting the trip, you agree to our automated fuel monitoring and safety compliance tracking.",
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: AppColors.slate400, height: 1.4),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

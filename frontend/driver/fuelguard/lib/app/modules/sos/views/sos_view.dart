import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/app_colors.dart';
import '../controllers/sos_controller.dart';

class SOSView extends StatefulWidget {
  const SOSView({super.key});

  @override
  State<SOSView> createState() => _SOSViewState();
}

class _SOSViewState extends State<SOSView> with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  final controller = Get.find<SOSController>();

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

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
          "Emergency SOS",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A)),
        ),
        centerTitle: true,
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.info_outline, color: AppColors.slate400)),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              _buildStatusBanner(),
              const SizedBox(height: 48),
              _buildPulsingSOSButton(),
              const SizedBox(height: 48),
              _buildLocationInfoCard(),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => controller.triggerSOS(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 4,
                  shadowColor: AppColors.primary.withOpacity(0.3),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.send, color: Colors.white, size: 20),
                    SizedBox(width: 12),
                    Text("Send Emergency Alert", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Accidental trigger? Notify dispatch within 10 seconds.",
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: AppColors.slate500, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withOpacity(0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.gpp_maybe, color: AppColors.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              "Triggering SOS will immediately notify dispatch and local authorities with your real-time coordinates.",
              style: TextStyle(fontSize: 13, color: AppColors.slate700, height: 1.5, fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPulsingSOSButton() {
    return Column(
      children: [
        SizedBox(
          width: 220,
          height: 220,
          child: Stack(
            alignment: Alignment.center,
            children: [
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  return Container(
                    width: 180 + (_pulseController.value * 40),
                    height: 180 + (_pulseController.value * 40),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.1 - (_pulseController.value * 0.1)),
                      shape: BoxShape.circle,
                    ),
                  );
                },
              ),
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  return Container(
                    width: 180 + (_pulseController.value * 20),
                    height: 180 + (_pulseController.value * 20),
                    decoration: BoxDecoration(
                      color: Colors.red.withOpacity(0.2 - (_pulseController.value * 0.2)),
                      shape: BoxShape.circle,
                    ),
                  );
                },
              ),
              Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(color: Colors.red.withOpacity(0.4), blurRadius: 30, spreadRadius: 5),
                  ],
                ),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.emergency_outlined, color: Colors.white, size: 48),
                    SizedBox(height: 8),
                    Text("SOS", style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 2)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          "Press and hold for 3 seconds to activate",
          style: TextStyle(fontSize: 14, color: AppColors.slate500, fontWeight: FontWeight.bold),
        ),
      ],
    );
  }

  Widget _buildLocationInfoCard() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.slate200),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: AppColors.slate100, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.location_on, color: AppColors.primary, size: 20),
                ),
                const SizedBox(width: 12),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("CURRENT GPS LOCATION", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.slate400, letterSpacing: 0.5)),
                      SizedBox(height: 2),
                      Text("Interstate 95, Exit 24 - Richmond, VA", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            height: 120,
            width: double.infinity,
            decoration: const BoxDecoration(
              image: DecorationImage(
                image: NetworkImage("https://lh3.googleusercontent.com/aida-public/AB6AXuCb99EaEvkQpHpxgr_MpZdRTwqLE8FDdF5UaemdgaRPCLz6uouDaBQJum2r3NlcjeAmZv2nE-xXOc3WXudyZsojPqM3OegMQQ9ZpEY7oOG_7XANqIkXFJO1QfxyKGTYvNiFSY5MhJq7tVkxYY5iU1c-SRImhJMK-FUQtSMJw7sjQ4mZuWG6yCUZWmNKRDoWpRH9mt_prXI1fvHp5iUvxISYuqPEta0D7gD6ROxnj1XlYPkUzqc398xkGHO_VWOFTjBE0hQVoN6btG7-"),
                fit: BoxFit.cover,
                opacity: 0.8,
              ),
            ),
            child: Center(
              child: Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(child: _buildCoordinateBox("Latitude", "37.5407° N")),
                const SizedBox(width: 12),
                Expanded(child: _buildCoordinateBox("Longitude", "77.4360° W")),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCoordinateBox(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(color: AppColors.backgroundLight, borderRadius: BorderRadius.circular(8)),
      child: Column(
        children: [
          Text(label.toUpperCase(), style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: AppColors.slate500, letterSpacing: 0.5)),
          const SizedBox(height: 2),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, fontFamily: 'monospace')),
        ],
      ),
    );
  }
}

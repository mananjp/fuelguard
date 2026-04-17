import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/app_colors.dart';
import '../../../routes/app_routes.dart';
import '../controllers/fuel_upload_controller.dart';

class FuelUploadView extends GetView<FuelUploadController> {
  const FuelUploadView({super.key});

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
          "Fuel Upload",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A)),
        ),
        centerTitle: true,
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.info_outline, color: AppColors.slate400)),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionHeader("CAPTURE EVIDENCE"),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(child: _buildCaptureCard("PUMP METER", "https://lh3.googleusercontent.com/aida-public/AB6AXuC1nANwqReytQjkToAWd3RtRH6pPQnBAU1FiVulq7cMUTlbX2iU6jRkFviVVsemR4ILb_sxJjXZ43rssfzvMpZk5SgpkSGDEWneuYt4DDtlQ2cWCoSz8KPArIjM-lsTxp2OcHs1YPBb5BxQfThCzEjTeyXoV2qtk9WmeHiQhOdhC1_-Lomto6tqMgZnPEJxkGr9fSTyluwXPe62ovWLnM8DE2QCrzRMuxDijE0vdWzAKV_yBIr93kpHEQTpigsbLc39aUCW501uuQu0")),
                  const SizedBox(width: 12),
                  Expanded(child: _buildCaptureCard("RECEIPT", "https://lh3.googleusercontent.com/aida-public/AB6AXuC1h7KjT0lK9Xy4vG7u6gA5-m9B8yX2_e7Y8Zt9v8P9_3XQY-G_f5p9f8v7w3XQY-G_f5p9f8v7w3XQY-G_f5p9f8v7w")),
                ],
              ),
              const SizedBox(height: 24),
              _buildSectionHeader("FUEL DETAILS"),
              const SizedBox(height: 12),
              _buildInputRow("Liters", "e.g. 52.4", Icons.oil_barrel_outlined),
              const SizedBox(height: 12),
              _buildInputRow("Amount (USD)", "e.g. 84.50", Icons.payments_outlined),
              const SizedBox(height: 24),
              _buildSectionHeader("VERIFIED GPS LOCATION"),
              const SizedBox(height: 12),
              _buildLocationCard(),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => Get.toNamed(Routes.AI_VERIFICATION),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size(double.infinity, 56),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 4,
                  shadowColor: AppColors.primary.withOpacity(0.2),
                ),
                child: const Text("Submit Report", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              const SizedBox(height: 16),
              const Center(
                child: Text(
                  "Report ID: FL-2023-88219",
                  style: TextStyle(fontSize: 10, color: AppColors.slate400, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.slate400, letterSpacing: 1.2),
    );
  }

  Widget _buildCaptureCard(String label, String imageUrl) {
    return Container(
      height: 180,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Column(
        children: [
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                image: DecorationImage(image: NetworkImage(imageUrl), fit: BoxFit.cover, opacity: 0.6),
              ),
              child: const Center(
                child: Icon(Icons.camera_alt, color: AppColors.primary, size: 32),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: Column(
              children: [
                Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                const SizedBox(height: 2),
                Text("Tap to capture", style: TextStyle(fontSize: 10, color: AppColors.slate400, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInputRow(String label, String hint, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppColors.slate400, size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.slate400)),
                TextField(
                  decoration: InputDecoration(
                    hintText: hint,
                    hintStyle: TextStyle(color: AppColors.slate300, fontSize: 16),
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(vertical: 4),
                  ),
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF0F172A)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLocationCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: const Icon(Icons.location_on, color: AppColors.primary, size: 24),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Shell - Downtown Station", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
                SizedBox(height: 2),
                Text("842 Market St, San Francisco, CA", style: TextStyle(fontSize: 11, color: AppColors.slate500)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(4)),
            child: const Text("VERIFIED 2m AGO", style: TextStyle(color: Color(0xFF15803D), fontSize: 8, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

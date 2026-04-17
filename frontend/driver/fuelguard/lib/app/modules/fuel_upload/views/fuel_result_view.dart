import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/app_colors.dart';
import '../../../routes/app_routes.dart';

class FuelResultView extends StatelessWidget {
  const FuelResultView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        backgroundColor: AppColors.backgroundLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.slate600),
          onPressed: () => Get.back(),
        ),
        title: const Text(
          "Fuel Transaction",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A)),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              _buildFraudScoreHeader(),
              const SizedBox(height: 24),
              _buildStatusBadges(),
              const SizedBox(height: 24),
              _buildTransactionDetails(),
              const SizedBox(height: 24),
              _buildAnalysisInfo(),
              const SizedBox(height: 32),
              _buildActionButtons(),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFraudScoreHeader() {
    return Column(
      children: [
        Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 120,
              height: 120,
              child: CircularProgressIndicator(
                value: 0.12,
                strokeWidth: 8,
                backgroundColor: AppColors.slate200,
                color: AppColors.emerald500,
                strokeCap: StrokeCap.round,
              ),
            ),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text("12", style: TextStyle(fontSize: 36, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                Text("FRAUD SCORE", style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: AppColors.slate500, letterSpacing: 0.5)),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatusBadges() {
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFDCFCE7)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppColors.emerald500, size: 14),
                    const SizedBox(width: 8),
                    Text("STATUS", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF065F46), letterSpacing: 0.5)),
                  ],
                ),
                const SizedBox(height: 4),
                const Text("Approved", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF064E3B))),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.slate100,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(Icons.verified_user, color: AppColors.slate400, size: 24),
        ),
      ],
    );
  }

  Widget _buildTransactionDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionHeader("TRANSACTION DETAILS"),
        const SizedBox(height: 12),
        _buildDetailCard(
          icon: Icons.local_gas_station,
          label: "Station",
          value: "Shell - Downtown Station",
          isPrimary: true,
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildMetricCard(Icons.payments, "Amount", r"$84.50")),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard(Icons.oil_barrel, "Liters", "52.4 L")),
          ],
        ),
        const SizedBox(height: 12),
        _buildDetailCard(
          icon: Icons.schedule,
          label: "Timestamp",
          value: "Oct 24, 2023 • 14:32 PM",
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.slate400, letterSpacing: 1.2),
    );
  }

  Widget _buildDetailCard({required IconData icon, required String label, required String value, bool isPrimary = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: isPrimary ? AppColors.primary.withOpacity(0.1) : AppColors.slate100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: isPrimary ? AppColors.primary : AppColors.slate400, size: 24),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.slate400)),
              Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(color: AppColors.slate100, shape: BoxShape.circle),
            child: Icon(icon, color: AppColors.slate400, size: 18),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.slate400, letterSpacing: 0.5)),
              Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAnalysisInfo() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withOpacity(0.1)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline, color: AppColors.primary, size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              "This transaction matches your typical refueling behavior and vehicle capacity. No anomalies detected.",
              style: TextStyle(fontSize: 13, color: AppColors.slate600, height: 1.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Column(
      children: [
        ElevatedButton(
          onPressed: () => Get.offAllNamed(Routes.MAIN),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            minimumSize: const Size(double.infinity, 56),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text("Continue Trip", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              SizedBox(width: 8),
              Icon(Icons.arrow_forward, color: Colors.white, size: 18),
            ],
          ),
        ),
        const SizedBox(height: 12),
        OutlinedButton(
          onPressed: () {},
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 56),
            side: BorderSide(color: AppColors.slate200),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.headset_mic_outlined, color: AppColors.slate600, size: 18),
              SizedBox(width: 8),
              Text("Contact Manager", style: TextStyle(color: AppColors.slate600, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ],
    );
  }
}

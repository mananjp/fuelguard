import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/app_colors.dart';
import '../controllers/trip_history_controller.dart';

class TripHistoryView extends GetView<TripHistoryController> {
  const TripHistoryView({super.key});

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
          "Trip History",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A)),
        ),
        centerTitle: true,
        actions: [
          IconButton(onPressed: () {}, icon: const Icon(Icons.search, color: AppColors.slate600)),
        ],
      ),
      body: Column(
        children: [
          _buildFilterTabs(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSummaryCard(),
                  const SizedBox(height: 24),
                  _buildSectionHeader("SEPTEMBER 2023"),
                  const SizedBox(height: 12),
                  _buildTripItem(
                    date: "Sep 24, 2023",
                    timePlace: "08:30 AM • Los Angeles, CA",
                    status: "Optimal",
                    statusColor: AppColors.emerald500,
                    icon: Icons.local_shipping,
                    distance: "42.5 mi",
                    fuel: "2.1 gal",
                    efficiency: "20.2 mpg",
                  ),
                  _buildTripItem(
                    date: "Sep 22, 2023",
                    timePlace: "02:15 PM • Irvine, CA",
                    status: "Warning",
                    statusColor: Colors.orange,
                    icon: Icons.directions_car,
                    distance: "115.0 mi",
                    fuel: "7.2 gal",
                    efficiency: "15.9 mpg",
                    isWarning: true,
                  ),
                  _buildTripItem(
                    date: "Sep 20, 2023",
                    timePlace: "09:00 AM • San Diego, CA",
                    status: "Optimal",
                    statusColor: AppColors.emerald500,
                    icon: Icons.local_shipping,
                    distance: "88.4 mi",
                    fuel: "4.1 gal",
                    efficiency: "21.5 mpg",
                  ),
                  const SizedBox(height: 16),
                  _buildSectionHeader("AUGUST 2023"),
                  const SizedBox(height: 12),
                  _buildTripItem(
                    date: "Aug 28, 2023",
                    timePlace: "11:30 AM • Riverside, CA",
                    status: "Optimal",
                    statusColor: AppColors.emerald500,
                    icon: Icons.local_shipping,
                    distance: "56.2 mi",
                    fuel: "2.6 gal",
                    efficiency: "21.6 mpg",
                  ),
                  const SizedBox(height: 80), // Space for nav
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.backgroundLight,
        border: Border(bottom: BorderSide(color: AppColors.slate200)),
      ),
      child: Row(
        children: [
          _buildTabItem("All Trips", isActive: true),
          _buildTabItem("Business"),
          _buildTabItem("Personal"),
        ],
      ),
    );
  }

  Widget _buildTabItem(String label, {bool isActive = false}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: isActive ? AppColors.primary : Colors.transparent, width: 2)),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
            color: isActive ? AppColors.primary : AppColors.slate500,
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: AppColors.primary.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildSummaryItem("TOTAL SEPTEMBER", "1,248.5 mi"),
          _buildSummaryItem("AVG FUEL", "21.4 mpg", crossAxisAlignment: CrossAxisAlignment.end),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, {CrossAxisAlignment crossAxisAlignment = CrossAxisAlignment.start}) {
    return Column(
      crossAxisAlignment: crossAxisAlignment,
      children: [
        Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white.withOpacity(0.8), letterSpacing: 0.5)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
      ],
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: AppColors.slate400, letterSpacing: 1.2),
    );
  }

  Widget _buildTripItem({
    required String date,
    required String timePlace,
    required String status,
    required Color statusColor,
    required IconData icon,
    required String distance,
    required String fuel,
    required String efficiency,
    bool isWarning = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                    child: Icon(icon, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(date, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF0F172A))),
                      const SizedBox(height: 2),
                      Text(timePlace, style: TextStyle(fontSize: 11, color: AppColors.slate500, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(999)),
                child: Row(
                  children: [
                    Container(width: 6, height: 6, decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle)),
                    const SizedBox(width: 6),
                    Text(status.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _buildTripMetric("DISTANCE", distance),
              const SizedBox(width: 8),
              _buildTripMetric("FUEL", fuel),
              const SizedBox(width: 8),
              _buildTripMetric("EFFICIENCY", efficiency, isAlert: isWarning),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTripMetric(String label, String value, {bool isAlert = false}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 8),
        decoration: BoxDecoration(color: AppColors.backgroundLight, borderRadius: BorderRadius.circular(8)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 8, fontWeight: FontWeight.w900, color: AppColors.slate400, letterSpacing: 0.5)),
            const SizedBox(height: 2),
            Text(
              value,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isAlert ? Colors.orange.shade700 : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/app_colors.dart';
import '../../../routes/app_routes.dart';
import '../controllers/dashboard_controller.dart';

class DashboardView extends GetView<DashboardController> {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(),
              _buildQuickActions(),
              _buildMetricsSection(),
              _buildStatusSection(),
              const SizedBox(height: 100), // Spacer for fixed bottom nav
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: Row(
        children: [
          const CircleAvatar(
            radius: 20,
            backgroundImage: NetworkImage("https://lh3.googleusercontent.com/aida-public/AB6AXuATFVMZUORUV0osy9B1-FDd79jEWfeyL86zMpafLlnhzk62PTDuABFt5UvLSkjEeYLBS2x204ZOcXeuYRq3azjKn4Hb8aGh-509q-BzKq0ZXYwP57hgAPtTxAe42RFHPMq8KO61D9kiTKMNKwfOPhhdmo4uq33yqNXpqXcb_9-WdxLaKVjF55Jy7ZFIX71sza9Z9wQza4V4BSyUnrjphUn0K4C9ONzmjQ-7Ib9ZKCF3UBG6bR_tTWEkoFBUy4jWMIKd8ifVC8XTV2dK"),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "FuelGuard Driver",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                ),
                Text(
                  "Alex Johnson • ID: FG-8829",
                  style: TextStyle(fontSize: 11, color: AppColors.slate500, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_none, color: AppColors.slate700),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 1.0,
        children: [
          _buildActionItem("Start Trip", Icons.play_circle_outline, AppColors.primary, Colors.white, () {
             // Navigation to Start Trip tab handled by MainController
          }, isPrimary: true),
          _buildActionItem("Upload Fuel", Icons.receipt_long_outlined, Colors.white, AppColors.primary, () => Get.toNamed(Routes.FUEL_UPLOAD)),
          _buildActionItem("Trip History", Icons.history, Colors.white, AppColors.primary, () => Get.toNamed(Routes.TRIP_HISTORY)),
          _buildActionItem("SOS Alert", Icons.emergency_outlined, const Color(0xFFFEF2F2), Colors.red, () => Get.toNamed(Routes.SOS), isDestructive: true),
        ],
      ),
    );
  }

  Widget _buildActionItem(String label, IconData icon, Color bgColor, Color iconColor, VoidCallback onTap, {bool isPrimary = false, bool isDestructive = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
          border: isPrimary ? null : Border.all(color: isDestructive ? const Color(0xFFFEE2E2) : AppColors.slate200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: isPrimary ? Colors.white : iconColor, size: 36),
            const SizedBox(height: 12),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isPrimary ? Colors.white : (isDestructive ? Colors.red : const Color(0xFF0F172A)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricsSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "KEY METRICS",
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: AppColors.slate500,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _buildMetricCard("Trust Score", "98/100", Icons.verified_user_outlined, "trending_up", "+2% this week"),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildMetricCard("Fuel Events", "3 Today", Icons.local_gas_station_outlined, null, "Last: 2h ago"),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetricCard(String label, String value, IconData icon, String? trend, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.slate200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: TextStyle(fontSize: 12, color: AppColors.slate500, fontWeight: FontWeight.w500)),
              Icon(icon, color: AppColors.primary, size: 16),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
          const SizedBox(height: 4),
          Row(
            children: [
              if (trend == "trending_up") 
                const Icon(Icons.trending_up, color: AppColors.emerald500, size: 14),
              const SizedBox(width: 4),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 11, 
                  color: trend == "trending_up" ? AppColors.emerald500 : AppColors.slate500,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusSection() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "STATUS & ASSETS",
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: AppColors.slate500,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          // Current Trip Card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.slate200),
            ),
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                            child: const Icon(Icons.route_outlined, color: AppColors.primary, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text("CURRENT TRIP", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.slate400)),
                              const Text("Chicago Depot → Austin Hub", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(4)),
                        child: const Text("In Progress", style: TextStyle(color: Color(0xFF1D4ED8), fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),
                Container(
                  height: 120,
                  width: double.infinity,
                  margin: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    image: const DecorationImage(
                      image: NetworkImage("https://lh3.googleusercontent.com/aida-public/AB6AXuBJ7YbG-BiIU3kSb01gbD0EFV4CutPmAjfnjt5u3YZ67kbpG7mQI65vKtpnWT9NtapZo-qYlbM7JQV6ZfQKC2NOl-RYfOYo7CBYJwMkotuLythi2N8dcxe05YJ7UuS8_uieSj84YZX6HJWn1dJ8Lj1wa2nWRymZlv06swUdEWzvx9JhTJRqeWNIE_YPVh1z_fhQLrevwxAXVAvB0Xih4wr4wVjC8vlRRON1anDU8p_f0gmkzu6zLAnABPI45P-cG0PJuxLMuYeth71H"),
                      fit: BoxFit.cover,
                      opacity: 0.8,
                    ),
                  ),
                  alignment: Alignment.bottomRight,
                  child: Padding(
                    padding: const EdgeInsets.all(8.0),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4)),
                      child: const Text("ETA: 4h 20m", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Distance: 1,120 mi", style: TextStyle(fontSize: 12, color: AppColors.slate500, fontWeight: FontWeight.w500)),
                      Text("Progress: 65%", style: TextStyle(fontSize: 12, color: AppColors.slate500, fontWeight: FontWeight.w500)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          // Assigned Truck Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.slate200),
            ),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(color: AppColors.slate100, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.local_shipping_outlined, color: AppColors.slate400, size: 32),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("ASSIGNED TRUCK", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.slate400)),
                      const Text("Freightliner Cascadia", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          _buildDetailChip(Icons.tag, "PLATE: TX-9928"),
                          const SizedBox(width: 12),
                          _buildDetailChip(Icons.oil_barrel_outlined, "FUEL: 82%"),
                        ],
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppColors.slate300),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailChip(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 12, color: AppColors.slate400),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(fontSize: 10, color: AppColors.slate600, fontWeight: FontWeight.w500)),
      ],
    );
  }
}

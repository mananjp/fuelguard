import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../../core/app_colors.dart';
import '../controllers/ai_verification_controller.dart';

class AIVerificationView extends StatefulWidget {
  const AIVerificationView({super.key});

  @override
  State<AIVerificationView> createState() => _AIVerificationViewState();
}

class _AIVerificationViewState extends State<AIVerificationView> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  final controller = Get.find<AIVerificationController>();

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat();
  }

  @override
  void dispose() {
    _animationController.dispose();
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
          "AI Verification",
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF0F172A)),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Scanner Frame
              AspectRatio(
                aspectRatio: 1,
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: AppColors.slate200,
                    borderRadius: BorderRadius.circular(12),
                    image: const DecorationImage(
                      image: NetworkImage("https://lh3.googleusercontent.com/aida-public/AB6AXuC1nANwqReytQjkToAWd3RtRH6pPQnBAU1FiVulq7cMUTlbX2iU6jRkFviVVsemR4ILb_sxJjXZ43rssfzvMpZk5SgpkSGDEWneuYt4DDtlQ2cWCoSz8KPArIjM-lsTxp2OcHs1YPBb5BxQfThCzEjTeyXoV2qtk9WmeHiQhOdhC1_-Lomto6tqMgZnPEJxkGr9fSTyluwXPe62ovWLnM8DE2QCrzRMuxDijE0vdWzAKV_yBIr93kpHEQTpigsbLc39aUCW501uuQu0"),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: Stack(
                    children: [
                      // Scanning Line
                      AnimatedBuilder(
                        animation: _animationController,
                        builder: (context, child) {
                          return Positioned(
                            top: _animationController.value * (MediaQuery.of(context).size.width - 32),
                            left: 0,
                            right: 0,
                            child: Container(
                              height: 2,
                              decoration: BoxDecoration(
                                color: AppColors.primary,
                                boxShadow: [
                                  BoxShadow(color: AppColors.primary.withOpacity(0.5), blurRadius: 10, spreadRadius: 2),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                      // Corners
                      Positioned(top: 16, left: 16, child: _buildScannerCorner(top: true, left: true)),
                      Positioned(top: 16, right: 16, child: _buildScannerCorner(top: true, left: false)),
                      Positioned(bottom: 16, left: 16, child: _buildScannerCorner(top: false, left: true)),
                      Positioned(bottom: 16, right: 16, child: _buildScannerCorner(top: false, left: false)),
                      
                      // Badge
                      Positioned(
                        bottom: 16,
                        left: 16,
                        right: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(8),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.document_scanner, color: AppColors.primary, size: 18),
                              const SizedBox(width: 8),
                              const Text("Scanning Receipt #7742...", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Center(
                child: Column(
                  children: [
                    const Text(
                      "AI verifying receipt and pump meter",
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      "Our neural network is matching fuel volume and pricing data to prevent fraudulent transactions.",
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: AppColors.slate500, height: 1.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              
              // Progress Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.slate200),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.sync, color: AppColors.primary, size: 20),
                            const SizedBox(width: 8),
                            const Text("Processing image data...", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          ],
                        ),
                        Text("${(controller.progress.value * 100).toInt()}%", style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.primary)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Obx(() => LinearProgressIndicator(
                      value: controller.progress.value,
                      backgroundColor: AppColors.slate100,
                      color: AppColors.primary,
                      borderRadius: BorderRadius.circular(999),
                      minHeight: 8,
                    )),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        _buildStatusItem("OCR extraction complete", Icons.check_circle, AppColors.emerald500, true),
                        const SizedBox(width: 16),
                        _buildStatusItem("Matching parameters", Icons.autorenew, AppColors.primary, false),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildScannerCorner({required bool top, required bool left}) {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        border: Border(
          top: top ? const BorderSide(color: AppColors.primary, width: 3) : BorderSide.none,
          bottom: !top ? const BorderSide(color: AppColors.primary, width: 3) : BorderSide.none,
          left: left ? const BorderSide(color: AppColors.primary, width: 3) : BorderSide.none,
          right: !left ? const BorderSide(color: AppColors.primary, width: 3) : BorderSide.none,
        ),
      ),
    );
  }

  Widget _buildStatusItem(String text, IconData icon, Color color, bool isDone) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, color: color, size: 14),
          const SizedBox(width: 6),
          Expanded(child: Text(text, style: TextStyle(fontSize: 10, color: AppColors.slate500, fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }
}

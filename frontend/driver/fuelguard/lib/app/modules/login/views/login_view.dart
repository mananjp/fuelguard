import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/app_colors.dart';
import '../controllers/login_controller.dart';
import '../../../routes/app_routes.dart';

class LoginView extends GetView<LoginController> {
  const LoginView({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Container(
            width: double.infinity,
            constraints: const BoxConstraints(maxWidth: 400),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.slate200),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 20,
                  offset: const Offset(0, 10),
                )
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Header Area
                Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    children: [
                      Container(
                        width: 64,
                        height: 64,
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.local_gas_station, color: AppColors.primary, size: 36),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        "FuelGuard",
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "ENTERPRISE FLEET MANAGEMENT",
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.5,
                          color: AppColors.slate500,
                        ),
                      ),
                    ],
                  ),
                ),

                // Image Banner
                Container(
                  height: 180,
                  width: double.infinity,
                  margin: const EdgeInsets.symmetric(horizontal: 32),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    image: const DecorationImage(
                      image: NetworkImage("https://lh3.googleusercontent.com/aida-public/AB6AXuCKy99GEbEaXaIjM9jJPuVFb9S1_cZ2C6-n7P_9IYSFhxMSg5E4RL7iy3-nZDY-H8uyW3cNQ08f42Oc1PpyBNCg0m0XaxGsgRjxNQ8D8bopXuoS8iPtnh1CA9wNQEZ9fpdyCYKG7WAjkzRr1lDcHEpsaAYIMstv0m4gctOD6bofW4M4lTWpdUd1KBZ0soop0Kufluz4oqaZK2R4rhPuS3vSyyKNCJ7BqdG-DfS7Fne0jnK3N355pl-oSzHiIpNqHXJpFGKLIDyDV9ur"),
                      fit: BoxFit.cover,
                    ),
                  ),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(8),
                      gradient: LinearGradient(
                        colors: [AppColors.primary.withOpacity(0.2), Colors.transparent],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                  ),
                ),

                // Form Area
                Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Welcome Back",
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        "Enter your driver credentials to access your routes and fuel logs.",
                        style: TextStyle(fontSize: 14, color: AppColors.slate600),
                      ),
                      const SizedBox(height: 24),
                      
                      // Driver ID
                      _buildLabel("Driver ID"),
                      const SizedBox(height: 8),
                      _buildTextField(
                        hint: "e.g. FG-88291",
                        icon: Icons.badge_outlined,
                        onChanged: (v) => controller.email.value = v,
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // PIN
                      _buildLabel("PIN / Password"),
                      const SizedBox(height: 8),
                      Obx(() => _buildTextField(
                        hint: "Enter your security PIN",
                        icon: Icons.lock_outline,
                        isPassword: true,
                        obscureText: !controller.isPasswordVisible.value,
                        onChanged: (v) => controller.password.value = v,
                        togglePassword: controller.togglePasswordVisibility,
                      )),
                      
                      const SizedBox(height: 16),
                      
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              SizedBox(
                                width: 24,
                                height: 24,
                                child: Checkbox(value: true, onChanged: (v) {}),
                              ),
                              const SizedBox(width: 8),
                              const Text("Remember me", style: TextStyle(fontSize: 12)),
                            ],
                          ),
                          TextButton(
                            onPressed: () {},
                            child: const Text("Forgot PIN?", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 16),
                      
                      Obx(() => ElevatedButton(
                        onPressed: controller.isLoading.value ? null : controller.login,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          minimumSize: const Size(double.infinity, 48),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text("Secure Login", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            const SizedBox(width: 8),
                            const Icon(Icons.login, color: Colors.white, size: 18),
                          ],
                        ),
                      )),

                      const SizedBox(height: 12),
                      
                      // Skip Button for Dev
                      OutlinedButton(
                        onPressed: controller.skipLogin,
                        style: OutlinedButton.styleFrom(
                          minimumSize: const Size(double.infinity, 44),
                          side: BorderSide(color: AppColors.slate200),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text("Skip to Dashboard (Dev)", style: TextStyle(color: AppColors.slate600, fontSize: 13)),
                      ),
                    ],
                  ),
                ),

                // Footer
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  decoration: const BoxDecoration(
                    border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                  ),
                  child: Column(
                    children: [
                      Text(
                        "POWERED BY FUELGUARD FLEET SYSTEMS",
                        style: TextStyle(fontSize: 10, color: AppColors.slate400, letterSpacing: -0.5),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text("v4.2.0-stable", style: TextStyle(fontSize: 10, color: AppColors.slate500)),
                          const SizedBox(width: 16),
                          Text("Privacy Policy", style: TextStyle(fontSize: 10, color: AppColors.slate500)),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.slate700),
    );
  }

  Widget _buildTextField({
    required String hint,
    required IconData icon,
    bool isPassword = false,
    bool obscureText = false,
    Function(String)? onChanged,
    VoidCallback? togglePassword,
  }) {
    return TextField(
      obscureText: obscureText,
      onChanged: onChanged,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: AppColors.slate400, fontSize: 14),
        suffixIcon: Icon(icon, size: 20, color: AppColors.slate400),
        prefixIcon: isPassword ? IconButton(
          icon: Icon(obscureText ? Icons.visibility_off : Icons.visibility, color: AppColors.slate400, size: 20),
          onPressed: togglePassword,
        ) : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: AppColors.slate300),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: AppColors.slate300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }
}

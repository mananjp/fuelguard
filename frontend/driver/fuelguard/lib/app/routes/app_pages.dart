import 'package:get/get.dart';
import '../modules/login/bindings/login_binding.dart';
import '../modules/login/views/login_view.dart';
import '../modules/dashboard/bindings/dashboard_binding.dart';
import '../modules/dashboard/views/dashboard_view.dart';
import '../modules/start_trip/bindings/start_trip_binding.dart';
import '../modules/start_trip/views/start_trip_view.dart';
import '../modules/fuel_upload/bindings/fuel_upload_binding.dart';
import '../modules/fuel_upload/views/fuel_upload_view.dart';
import '../modules/fuel_upload/views/fuel_result_view.dart';
import '../modules/trip_history/bindings/trip_history_binding.dart';
import '../modules/trip_history/views/trip_history_view.dart';
import '../modules/sos/bindings/sos_binding.dart';
import '../modules/sos/views/sos_view.dart';
import '../modules/main/bindings/main_binding.dart';
import '../modules/main/views/main_view.dart';
import '../modules/ai_verification/bindings/ai_verification_binding.dart';
import '../modules/ai_verification/views/ai_verification_view.dart';
import 'app_routes.dart';

class AppPages {
  static const INITIAL = Routes.LOGIN;

  static final routes = [
    GetPage(
      name: Routes.LOGIN,
      page: () => const LoginView(),
      binding: LoginBinding(),
    ),
    GetPage(
      name: Routes.MAIN,
      page: () => const MainView(),
      binding: MainBinding(),
    ),
    GetPage(
      name: Routes.AI_VERIFICATION,
      page: () => const AIVerificationView(),
      binding: AIVerificationBinding(),
    ),
    GetPage(
      name: Routes.DASHBOARD,
      page: () => const DashboardView(),
      binding: DashboardBinding(),
    ),
    GetPage(
      name: Routes.START_TRIP,
      page: () => const StartTripView(),
      binding: StartTripBinding(),
    ),
    GetPage(
      name: Routes.FUEL_UPLOAD,
      page: () => const FuelUploadView(),
      binding: FuelUploadBinding(),
    ),
    GetPage(
      name: Routes.FUEL_RESULT,
      page: () => const FuelResultView(),
    ),
    GetPage(
      name: Routes.TRIP_HISTORY,
      page: () => const TripHistoryView(),
      binding: TripHistoryBinding(),
    ),
    GetPage(
      name: Routes.SOS,
      page: () => const SOSView(),
      binding: SOSBinding(),
    ),
  ];
}

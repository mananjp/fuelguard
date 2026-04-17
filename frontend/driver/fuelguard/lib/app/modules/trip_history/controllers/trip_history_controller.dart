import 'package:get/get.dart';

class TripHistoryController extends GetxController {
  final trips = <Map<String, dynamic>>[
    {
      "date": "Oct 24, 2023",
      "route": "Surat → Mumbai",
      "distance": "280 km",
      "fuel": "450 L",
      "status": "Completed"
    },
    {
      "date": "Oct 22, 2023",
      "route": "Ahmedabad → Surat",
      "distance": "260 km",
      "fuel": "410 L",
      "status": "Completed"
    },
    {
      "date": "Oct 19, 2023",
      "route": "Vadodara → Ahmedabad",
      "distance": "110 km",
      "fuel": "180 L",
      "status": "Completed"
    },
  ].obs;
}

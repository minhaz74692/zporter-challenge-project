import 'app_notification.dart';

/// The notifications data boundary. `data/` implements it against the REST API;
/// tests supply a fake.
abstract interface class NotificationsRepository {
  Future<List<AppNotification>> list();

  Future<void> markRead(String id);
}

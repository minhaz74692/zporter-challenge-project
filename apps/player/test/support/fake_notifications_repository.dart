import 'package:challenge/features/notifications/domain/app_notification.dart';
import 'package:challenge/features/notifications/domain/notifications_repository.dart';

class FakeNotificationsRepository implements NotificationsRepository {
  List<AppNotification> items = const [];
  Object? listError;
  final List<String> readIds = [];

  @override
  Future<List<AppNotification>> list() async {
    if (listError != null) throw listError!;
    return items;
  }

  @override
  Future<void> markRead(String id) async => readIds.add(id);
}

AppNotification buildNotification({
  String id = 'n1',
  AppNotificationType type = AppNotificationType.challengeInvite,
  String title = 'You have a new challenge',
  String body = '40m Sprint',
  bool read = false,
  String? challengeId = 'c1',
  String? actorId,
}) => AppNotification(
  id: id,
  type: type,
  title: title,
  body: body,
  read: read,
  createdAt: DateTime.now().subtract(const Duration(hours: 2)),
  challengeId: challengeId,
  actorId: actorId,
);

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/network_providers.dart';
import '../domain/app_notification.dart';
import '../domain/notifications_repository.dart';

class NotificationsRepositoryImpl implements NotificationsRepository {
  NotificationsRepositoryImpl(this._dio);

  final Dio _dio;

  @override
  Future<List<AppNotification>> list() {
    return guardApiCall(() async {
      final res = await _dio.get<List<dynamic>>('/notifications');
      return (res.data ?? const [])
          .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
          .toList(growable: false);
    });
  }

  @override
  Future<void> markRead(String id) => guardApiCall(() async {
    await _dio.post<void>('/notifications/$id/read');
  });
}

final notificationsRepositoryProvider = Provider<NotificationsRepository>(
  (ref) => NotificationsRepositoryImpl(ref.watch(dioProvider)),
);

import 'package:challenge/core/network/dio_client.dart';
import 'package:challenge/features/notifications/application/notifications_provider.dart';
import 'package:challenge/features/notifications/data/notifications_repository_impl.dart';
import 'package:challenge/features/notifications/domain/app_notification.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fake_http_adapter.dart';
import '../../support/fake_notifications_repository.dart';
import '../../support/fake_token_storage.dart';

void main() {
  group('AppNotification.fromJson', () {
    test('maps type + optional actor/challenge, defaults read', () {
      final n = AppNotification.fromJson({
        'id': 'n1',
        'type': 'result_verify_request',
        'title': 'Priya asked you to verify a result',
        'body': '40m Sprint',
        'challengeId': 'c1',
        'actorId': 'u_priya',
        'createdAt': '2026-08-31T10:00:00.000Z',
      });
      expect(n.type, AppNotificationType.resultVerifyRequest);
      expect(n.isVerifyRequest, isTrue);
      expect(n.actorId, 'u_priya');
      expect(n.read, isFalse);
    });

    test('unknown type falls back to other', () {
      final n = AppNotification.fromJson({
        'id': 'n2',
        'type': 'something_new',
        'title': 't',
        'body': 'b',
        'read': true,
        'createdAt': '2026-08-31T10:00:00.000Z',
      });
      expect(n.type, AppNotificationType.other);
      expect(n.read, isTrue);
    });
  });

  group('NotificationsRepositoryImpl', () {
    NotificationsRepositoryImpl build(
      Future<ResponseBody> Function(RequestOptions) handle,
    ) {
      final dio = DioClient.build(
        baseUrl: 'http://test.local',
        storage: FakeTokenStorage(access: 'tok'),
        onAuthLost: () {},
        adapter: FakeHttpAdapter(handle),
      );
      return NotificationsRepositoryImpl(dio);
    }

    test('list() parses rows', () async {
      final repo = build((_) async {
        return jsonResponse([
          {
            'id': 'n1',
            'type': 'challenge_invite',
            'title': 'New challenge',
            'body': '40m Sprint',
            'read': false,
            'createdAt': '2026-08-31T10:00:00.000Z',
          },
        ], 200);
      });
      final list = await repo.list();
      expect(list.single.type, AppNotificationType.challengeInvite);
    });

    test('markRead() POSTs to the read route', () async {
      RequestOptions? seen;
      final repo = build((o) async {
        seen = o;
        return jsonResponse(const <String, dynamic>{}, 204);
      });
      await repo.markRead('n9');
      expect(seen?.method, 'POST');
      expect(seen?.path, endsWith('/notifications/n9/read'));
    });
  });

  group('NotificationsNotifier', () {
    test('markRead flips read optimistically and calls the repo', () async {
      final repo = FakeNotificationsRepository()
        ..items = [buildNotification(id: 'a'), buildNotification(id: 'b')];
      final container = ProviderContainer(
        overrides: [notificationsRepositoryProvider.overrideWithValue(repo)],
      );
      addTearDown(container.dispose);
      await container.read(notificationsProvider.future);

      await container.read(notificationsProvider.notifier).markRead('a');

      final list = container.read(notificationsProvider).value!;
      expect(list.firstWhere((n) => n.id == 'a').read, isTrue);
      expect(list.firstWhere((n) => n.id == 'b').read, isFalse);
      expect(repo.readIds, ['a']);
      expect(container.read(unreadNotificationCountProvider), 1);
    });
  });
}

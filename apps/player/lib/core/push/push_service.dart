import 'dart:io';

import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:go_router/go_router.dart';

import '../network/api_exception.dart';
import '../router/app_routes.dart';

/// Fires in a background isolate for a data / background push. The OS renders
/// tray notifications for `notification` payloads on its own, and this app has
/// no work to do off the main isolate, so this is intentionally a no-op — it
/// just has to exist and be a top-level, `vm:entry-point` function.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {}

/// Thin API client for the one device endpoint. Device-token registration is
/// infrastructure, not a feature, so it lives in `core/`.
class PushApi {
  PushApi(this._dio);

  final Dio _dio;

  static String get _platform => Platform.isIOS ? 'ios' : 'android';

  Future<void> registerToken(String token) => guardApiCall(() async {
    await _dio.post<void>(
      '/devices/fcm-token',
      data: {'token': token, 'platform': _platform},
    );
  });
}

/// Owns the FCM lifecycle: permission, the Android channel, foreground display
/// via local notifications, tap routing, and keeping the backend's device-token
/// record in sync with sign-in / sign-out.
///
/// Every entry point is defensive — if Firebase isn't configured on the
/// platform, push is simply disabled and the app runs normally.
class PushService {
  PushService({required PushApi api, required GoRouter router})
    : _api = api,
      _router = router;

  final PushApi _api;
  final GoRouter _router;
  final _local = FlutterLocalNotificationsPlugin();

  static const _channel = AndroidNotificationChannel(
    'zporter_default',
    'General',
    description: 'Challenge invites, reminders and results',
    importance: Importance.high,
  );

  bool _started = false;
  String? _registeredToken;

  /// Idempotent one-time wiring.
  Future<void> _start() async {
    if (_started) return;
    _started = true;

    try {
      final messaging = FirebaseMessaging.instance;

      await messaging.requestPermission();
      await messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      await _local.initialize(
        const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
          iOS: DarwinInitializationSettings(),
        ),
        onDidReceiveNotificationResponse: (r) => _openChallenge(r.payload),
      );
      await _local
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >()
          ?.createNotificationChannel(_channel);

      FirebaseMessaging.onMessage.listen(_showForeground);
      FirebaseMessaging.onMessageOpenedApp.listen(
        (m) => _openChallenge(m.data['challengeId'] as String?),
      );
      final opened = await messaging.getInitialMessage();
      if (opened != null) {
        _openChallenge(opened.data['challengeId'] as String?);
      }

      messaging.onTokenRefresh.listen(_register);
    } catch (e) {
      debugPrint('PushService: FCM unavailable, push disabled ($e)');
    }
  }

  /// Called when the user signs in: register this device's token with the API.
  Future<void> syncToken() async {
    await _start();
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await _register(token);
    } catch (e) {
      debugPrint('PushService.syncToken failed ($e)');
    }
  }

  /// Called on sign-out: drop the token so this device stops receiving push.
  Future<void> clear() async {
    _registeredToken = null;
    try {
      await FirebaseMessaging.instance.deleteToken();
    } catch (_) {
      // Best-effort.
    }
  }

  Future<void> _register(String token) async {
    if (token == _registeredToken) return;
    try {
      await _api.registerToken(token);
      _registeredToken = token;
    } on ApiException catch (e) {
      debugPrint('PushService: token register failed (${e.message})');
    }
  }

  void _showForeground(RemoteMessage message) {
    final n = message.notification;
    if (n == null) return;
    _local.show(
      n.hashCode,
      n.title,
      n.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: message.data['challengeId'] as String?,
    );
  }

  void _openChallenge(String? challengeId) {
    if (challengeId != null && challengeId.isNotEmpty) {
      _router.push(AppRoutes.challengeDetail(challengeId));
    }
  }
}

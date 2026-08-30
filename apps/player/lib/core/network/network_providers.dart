import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../config/app_config.dart';
import '../storage/token_storage.dart';
import 'dio_client.dart';
import 'session_events.dart';

final secureStorageProvider = Provider<FlutterSecureStorage>(
  (ref) => const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  ),
);

final tokenStorageProvider = Provider<TokenStorage>(
  (ref) => SecureTokenStorage(ref.watch(secureStorageProvider)),
);

final sessionEventsProvider = Provider<SessionEvents>((ref) {
  final events = SessionEvents();
  ref.onDispose(events.dispose);
  return events;
});

/// The configured [Dio] every repository injects. A single client (and its
/// in-flight-refresh state) is shared app-wide.
final dioProvider = Provider<Dio>((ref) {
  final events = ref.watch(sessionEventsProvider);
  return DioClient.build(
    baseUrl: AppConfig.apiBaseUrl,
    storage: ref.watch(tokenStorageProvider),
    onAuthLost: events.notifyExpired,
  );
});

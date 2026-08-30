import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../config/app_config.dart';
import '../storage/token_storage.dart';
import 'dio_client.dart';
import 'session_events.dart';

part 'network_providers.g.dart';

@Riverpod(keepAlive: true)
FlutterSecureStorage secureStorage(Ref ref) => const FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
);

@Riverpod(keepAlive: true)
TokenStorage tokenStorage(Ref ref) =>
    SecureTokenStorage(ref.watch(secureStorageProvider));

@Riverpod(keepAlive: true)
SessionEvents sessionEvents(Ref ref) {
  final events = SessionEvents();
  ref.onDispose(events.dispose);
  return events;
}

/// The configured [Dio] every repository injects. `keepAlive` so the single
/// client (and its in-flight-refresh state) is shared app-wide.
@Riverpod(keepAlive: true)
Dio dio(Ref ref) {
  final events = ref.watch(sessionEventsProvider);
  return DioClient.build(
    baseUrl: AppConfig.apiBaseUrl,
    storage: ref.watch(tokenStorageProvider),
    onAuthLost: events.notifyExpired,
  );
}

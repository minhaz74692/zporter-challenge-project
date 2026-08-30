/// Build-time configuration, supplied with `--dart-define`.
///
/// The default targets the NestJS API as seen from the **Android emulator**
/// (`10.0.2.2` is the host loopback). Override for a device or the iOS
/// simulator, e.g. `flutter run --dart-define=API_BASE_URL=http://192.168.1.5:3000`.
abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
}

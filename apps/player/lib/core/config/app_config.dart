/// Build-time configuration, supplied with `--dart-define` /
/// `--dart-define-from-file`.
///
/// The default targets the NestJS API as seen from the **Android emulator**
/// (`10.0.2.2` is the host loopback). For a physical device or the iOS
/// simulator, point it at the host machine instead — either inline
/// (`--dart-define=API_BASE_URL=http://192.168.0.104:3000`) or via the
/// git-ignored `config/local.json`
/// (`flutter run --dart-define-from-file=config/local.json`). See the README.
abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
}

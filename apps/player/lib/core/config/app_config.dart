/// Build-time configuration, supplied with `--dart-define` /
/// `--dart-define-from-file`.
///
/// The default targets a local NestJS API as seen from the **Android emulator**
/// (`10.0.2.2` is the host loopback). To hit the deployed API, run with
/// `--dart-define-from-file=config/cloud.json`. For a local API on a physical
/// device or the iOS simulator, point it at the host machine instead — inline
/// (`--dart-define=API_BASE_URL=http://192.168.0.104:3000`) or via the
/// git-ignored `config/local.json`. See the README.
abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
}

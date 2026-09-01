/// Build-time configuration, supplied with `--dart-define` /
/// `--dart-define-from-file`.
///
/// The default targets the deployed Cloud Run API, so a bare `flutter run`
/// works with no flags. For a local API, run `make local` or pass
/// `--dart-define-from-file=config/local.json` (git-ignored) — set it to
/// `http://10.0.2.2:3000` for the Android emulator, or the host's LAN IP
/// (`http://192.168.0.104:3000`) for a physical device / iOS simulator.
/// See the README.
abstract final class AppConfig {
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    // Local default:
    // defaultValue: 'http://10.0.2.2:3000',
    defaultValue: 'https://zporter-api-d4awjs3cxa-uc.a.run.app',
  );
}

/// Route paths, referenced by name everywhere instead of string literals.
abstract final class AppRoutes {
  static const login = '/login';
  static const signup = '/signup';
  static const home = '/';

  /// Challenge detail. [challengeDetailPattern] is the go_router path template;
  /// [challengeDetail] builds a concrete location.
  static const challengeDetailPattern = '/challenges/:id';
  static String challengeDetail(String id) => '/challenges/$id';
}

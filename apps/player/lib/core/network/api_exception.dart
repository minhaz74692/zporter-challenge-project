import 'package:dio/dio.dart';

/// The one error type the app's data layer throws.
///
/// Wraps the API's uniform error body
/// (`{ statusCode, error, message, path, timestamp }`, where `message` is a
/// string or a `class-validator` string[]) and the transport-level failures
/// Dio raises before any response arrives.
class ApiException implements Exception {
  const ApiException({
    required this.statusCode,
    required this.message,
    this.fieldErrors = const [],
  });

  /// HTTP status, or `0` when the request never reached the server.
  final int statusCode;

  /// A single human-readable line, safe to show in a snackbar.
  final String message;

  /// Every validation message when the API returned a list; else empty.
  final List<String> fieldErrors;

  bool get isNetworkError => statusCode == 0;
  bool get isUnauthorized => statusCode == 401;

  factory ApiException.fromDio(DioException e) {
    final response = e.response;
    if (response == null) {
      return const ApiException(
        statusCode: 0,
        message: 'Cannot reach the server. Check your connection and try again.',
      );
    }

    final status = response.statusCode ?? 0;
    final data = response.data;

    if (data is Map<String, dynamic>) {
      final raw = data['message'];
      if (raw is List && raw.isNotEmpty) {
        final messages = raw.map((m) => m.toString()).toList();
        return ApiException(
          statusCode: status,
          message: messages.first,
          fieldErrors: messages,
        );
      }
      if (raw is String && raw.isNotEmpty) {
        return ApiException(statusCode: status, message: raw);
      }
    }

    return ApiException(statusCode: status, message: 'Request failed ($status).');
  }

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Last interceptor in the chain: replaces any unrecovered [DioException] with
/// an [ApiException] so repositories never see Dio's error types.
class ErrorInterceptor extends Interceptor {
  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    handler.reject(
      err.copyWith(error: ApiException.fromDio(err)),
    );
  }
}

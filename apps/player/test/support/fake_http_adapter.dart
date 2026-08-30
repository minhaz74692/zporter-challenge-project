import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';

/// Drives Dio from a plain `request → response` function — no sockets.
class FakeHttpAdapter implements HttpClientAdapter {
  FakeHttpAdapter(this.handle);

  final Future<ResponseBody> Function(RequestOptions options) handle;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) => handle(options);

  @override
  void close({bool force = false}) {}
}

/// A JSON [ResponseBody] with the content-type header Dio needs to auto-decode.
ResponseBody jsonResponse(Object body, int status) => ResponseBody.fromString(
  jsonEncode(body),
  status,
  headers: {
    Headers.contentTypeHeader: [Headers.jsonContentType],
  },
);

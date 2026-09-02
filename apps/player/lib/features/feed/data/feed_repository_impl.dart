import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/network_providers.dart';
import '../domain/feed_post.dart';
import '../domain/feed_repository.dart';

/// REST implementation of [FeedRepository]. Every method routes through
/// [guardApiCall] so the only thing it throws is [ApiException].
class FeedRepositoryImpl implements FeedRepository {
  FeedRepositoryImpl(this._dio);

  final Dio _dio;

  @override
  Future<List<FeedPost>> list(FeedTab tab) {
    return guardApiCall(() async {
      final res = await _dio.get<List<dynamic>>(
        '/feed',
        queryParameters: {'tab': tab.apiValue},
      );
      return (res.data ?? const [])
          .map((e) => FeedPost.fromJson(e as Map<String, dynamic>))
          .toList(growable: false);
    });
  }

  @override
  Future<int> setLike(String postId, {required bool liked}) {
    return guardApiCall(() async {
      final res = await _dio.request<Map<String, dynamic>>(
        '/feed/$postId/like',
        options: Options(method: liked ? 'POST' : 'DELETE'),
      );
      return (res.data?['likeCount'] as num?)?.toInt() ?? 0;
    });
  }

  @override
  Future<void> setSave(String postId, {required bool saved}) {
    return guardApiCall(() async {
      await _dio.request<void>(
        '/feed/$postId/save',
        options: Options(method: saved ? 'POST' : 'DELETE'),
      );
    });
  }
}

final feedRepositoryProvider = Provider<FeedRepository>(
  (ref) => FeedRepositoryImpl(ref.watch(dioProvider)),
);

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/network_providers.dart';
import '../domain/biography_repository.dart';
import '../domain/challenge_result.dart';

/// REST implementation of [BiographyRepository]. Every call routes through
/// [guardApiCall] so the only thing it throws is [ApiException].
class BiographyRepositoryImpl implements BiographyRepository {
  BiographyRepositoryImpl(this._dio);

  final Dio _dio;

  @override
  Future<List<ChallengeResult>> myResults() {
    return guardApiCall(() async {
      final res = await _dio.get<List<dynamic>>('/challenges/mine/results');
      return (res.data ?? const [])
          .map((e) => ChallengeResult.fromJson(e as Map<String, dynamic>))
          .toList(growable: false);
    });
  }
}

final biographyRepositoryProvider = Provider<BiographyRepository>(
  (ref) => BiographyRepositoryImpl(ref.watch(dioProvider)),
);

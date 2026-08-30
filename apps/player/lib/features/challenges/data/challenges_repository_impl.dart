import 'package:dio/dio.dart';

import '../../../core/network/api_exception.dart';
import '../domain/challenge.dart';
import '../domain/challenge_detail.dart';
import '../domain/challenge_enums.dart';
import '../domain/challenges_repository.dart';
import '../domain/leaderboard_entry.dart';
import '../domain/participant.dart';

/// REST implementation of [ChallengesRepository]. Every method routes through
/// [guardApiCall] so the only thing it throws is [ApiException].
class ChallengesRepositoryImpl implements ChallengesRepository {
  ChallengesRepositoryImpl(this._dio);

  final Dio _dio;

  @override
  Future<List<Challenge>> list(ChallengeCategory category) {
    return guardApiCall(() async {
      final res = await _dio.get<List<dynamic>>(
        '/challenges',
        queryParameters: {'category': category.apiValue},
      );
      return _mapList(res.data, Challenge.fromJson);
    });
  }

  @override
  Future<ChallengeDetail> getById(String id) {
    return guardApiCall(() async {
      final res = await _dio.get<Map<String, dynamic>>('/challenges/$id');
      return ChallengeDetail.fromJson(res.data!);
    });
  }

  @override
  Future<void> accept(String id) => guardApiCall(() async {
    await _dio.post<void>('/challenges/$id/accept');
  });

  @override
  Future<void> decline(String id) => guardApiCall(() async {
    await _dio.post<void>('/challenges/$id/decline');
  });

  @override
  Future<List<Participant>> participants(String id) {
    return guardApiCall(() async {
      final res = await _dio.get<List<dynamic>>('/challenges/$id/participants');
      return _mapList(res.data, Participant.fromJson);
    });
  }

  @override
  Future<List<LeaderboardEntry>> leaderboard(String id) {
    return guardApiCall(() async {
      final res = await _dio.get<List<dynamic>>('/challenges/$id/leaderboard');
      return _mapList(res.data, LeaderboardEntry.fromJson);
    });
  }

  static List<T> _mapList<T>(
    List<dynamic>? rows,
    T Function(Map<String, dynamic>) fromJson,
  ) =>
      (rows ?? const [])
          .map((e) => fromJson(e as Map<String, dynamic>))
          .toList(growable: false);
}

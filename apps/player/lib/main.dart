import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';

void main() {
  runApp(
    // ProviderScope is the root of Riverpod's dependency graph; every provider
    // (repositories, notifiers) is resolved from here. Tests wrap widgets in
    // their own scope with overrides.
    const ProviderScope(child: ZporterChallengeApp()),
  );
}

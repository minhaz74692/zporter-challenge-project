import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';
import 'core/push/push_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Push is optional: if the platform has no Firebase config, log and carry on.
  try {
    await Firebase.initializeApp();
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  } catch (e) {
    debugPrint('Firebase not configured — push notifications disabled ($e)');
  }

  runApp(
    // ProviderScope is the root of Riverpod's dependency graph; every provider
    // (repositories, notifiers) is resolved from here. Tests wrap widgets in
    // their own scope with overrides.
    const ProviderScope(child: ZporterChallengeApp()),
  );
}

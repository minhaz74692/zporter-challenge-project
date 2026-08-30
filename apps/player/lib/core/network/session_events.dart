import 'dart:async';

/// A one-way channel the network layer uses to announce that the session is
/// gone (refresh failed). The router listens and redirects to login; nothing
/// in `core/network` needs to know about routing or auth state.
class SessionEvents {
  final _controller = StreamController<void>.broadcast();

  Stream<void> get onExpired => _controller.stream;

  void notifyExpired() => _controller.add(null);

  void dispose() => _controller.close();
}

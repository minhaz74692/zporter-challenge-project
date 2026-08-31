# Zporter player — run shortcuts.
#   make cloud             run against the deployed Cloud Run API
#   make local             run against a local API (edit config/local.json for your target)
#   make cloud ARGS="-d chrome"   pass extra flutter args
#
# config/cloud.json  → committed, points at Cloud Run.
# config/local.json  → git-ignored, yours to edit (iOS sim: localhost:3000,
#                      Android emulator: 10.0.2.2:3000, device: your-LAN-IP:3000).

ARGS ?=

.PHONY: cloud local build-cloud

cloud:
	flutter run --dart-define-from-file=config/cloud.json $(ARGS)

local:
	flutter run --dart-define-from-file=config/local.json $(ARGS)

build-cloud:
	flutter build apk --release --dart-define-from-file=config/cloud.json

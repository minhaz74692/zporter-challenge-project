import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_exception.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../../../core/widgets/app_icon.dart';
import '../../../../core/widgets/gradient_panel.dart';
import '../../../../core/widgets/labeled_field.dart';
import '../../../../core/widgets/primary_button.dart';
import '../../../auth/application/auth_notifier.dart';
import '../../application/challenge_detail_provider.dart';
import '../../application/challenge_list_provider.dart';
import '../../application/submit_result.dart';
import '../../domain/challenge.dart';
import '../../domain/participant.dart';
import '../../domain/result_strategy.dart';
import 'controller_picker.dart';
import 'result_summary_card.dart';
import 'result_video_field.dart';

/// The "Add result" / "Report" tab. Three states, driven by the viewer's
/// [ParticipantSummary]:
/// - not accepted            → a prompt to accept first
/// - accepted, no result yet → the Figma report form
/// - result submitted        → a read-only summary of what was reported
class ChallengeReportView extends ConsumerStatefulWidget {
  const ChallengeReportView({
    required this.challenge,
    required this.participant,
    super.key,
  });

  final Challenge challenge;
  final ParticipantSummary? participant;

  @override
  ConsumerState<ChallengeReportView> createState() =>
      _ChallengeReportViewState();
}

class _ChallengeReportViewState extends ConsumerState<ChallengeReportView> {
  final _value = TextEditingController();
  final _arena = TextEditingController();
  final _controllerField = TextEditingController();
  bool _toggle = false;
  // Ships with the submission but has no UI right now — see `_ShareToFeedToggle`.
  final bool _shareToFeed = false;
  DateTime _performedAt = DateTime.now();
  String? _videoUrl;
  String? _controllerHandle;
  bool _submitting = false;

  Challenge get c => widget.challenge;
  ResultStrategy get _strategy => resultStrategyFor(c.resultType);

  @override
  void dispose() {
    _value.dispose();
    _arena.dispose();
    _controllerField.dispose();
    super.dispose();
  }

  void _snack(String message) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _performedAt,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
    );
    if (picked != null) {
      setState(
        () => _performedAt = DateTime(
          picked.year,
          picked.month,
          picked.day,
          _performedAt.hour,
          _performedAt.minute,
        ),
      );
    }
  }

  Future<void> _pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_performedAt),
    );
    if (picked != null) {
      setState(
        () => _performedAt = DateTime(
          _performedAt.year,
          _performedAt.month,
          _performedAt.day,
          picked.hour,
          picked.minute,
        ),
      );
    }
  }

  void _step(int delta) {
    _value.text = _strategy.step(_value.text, delta);
  }

  Future<void> _pickController() async {
    final choice = await showControllerPicker(
      context,
      ref,
      challengeId: c.id,
      excludeUserId: ref.read(authNotifierProvider).valueOrNull?.id,
    );
    if (choice != null) {
      setState(() {
        _controllerHandle = choice.handle;
        _controllerField.text = choice.handle;
      });
    }
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      await ref
          .read(submitResultProvider)
          .call(
            challengeId: c.id,
            resultType: c.resultType,
            rawValue: _value.text,
            toggleValue: _toggle,
            videoUrl: _videoUrl ?? '',
            controllerRef: _controllerHandle ?? '',
            performedAt: _performedAt,
            arena: _arena.text,
            shareToFeed: _shareToFeed,
          );

      ref.invalidate(challengeDetailProvider(c.id));
      ref.invalidate(challengeListProvider);
      ref.invalidate(challengeLeaderboardProvider(c.id));

      if (!mounted) return;
      _snack('Challenge successfully reported');
      // Stay on this tab — the detail refetch rebuilds it as the read-only
      // result summary (and the tab renames to "Report").
    } on ResultValidationException catch (e) {
      _snack(e.message);
    } on ApiException catch (e) {
      _snack(e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final vp = widget.participant;
    final submitted = vp?.submittedResult;

    final Widget body;
    if (submitted != null) {
      body = ResultSummaryCard(
        result: submitted,
        rank: vp?.rank,
        badge: vp?.awardedBadge,
      );
    } else if (vp != null && vp.hasAccepted && !c.hasEnded) {
      body = _form();
    } else if (c.hasEnded) {
      body = _message('This challenge has ended.');
    } else {
      body = _message('Accept this challenge to report a result.');
    }

    // One continuous gradient panel with a rounded top, filling the tab body.
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: GradientPanel(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 28),
            child: body,
          ),
        ),
      ),
    );
  }

  Widget _message(String text) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 48),
    child: Center(
      child: Text(
        text,
        textAlign: TextAlign.center,
        style: const TextStyle(color: AppColors.muted),
      ),
    ),
  );

  /// A trailing field glyph from `assets/icon/`, tinted `#818389` — at 50%
  /// opacity for [faded] icons (calendar), full for the rest (the arena pin).
  /// Carries a 15px right margin; [fieldDecoration] sizes the slot to match.
  Widget _fieldIcon(AppIconAsset asset, {bool faded = true}) => Padding(
    padding: const EdgeInsets.only(right: 15),
    child: AppIcon(
      asset,
      size: 18,
      color: faded
          ? AppColors.pillEquipment.withValues(alpha: 0.5)
          : AppColors.pillEquipment,
    ),
  );

  Widget _form() {
    return Column(
      children: [
        ResultVideoField(
          challengeId: c.id,
          onChanged: (url) => setState(() => _videoUrl = url),
        ),
        const SizedBox(height: 22),
        LabeledField(
          label: 'Challenge result',
          accent: true,
          child: _strategy.isBoolean ? _toggleInput() : _numberInput(),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              flex: 6,
              child: LabeledField(
                label: 'Date',
                onTap: _pickDate,
                trailing: _fieldIcon(AppIconAsset.calendar),
                child: Text(
                  formatDate(_performedAt),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 5,
              child: LabeledField(
                label: 'Time',
                onTap: _pickTime,
                // The Figma uses the calendar glyph on the Time field too.
                trailing: _fieldIcon(AppIconAsset.calendar),
                child: Text(
                  formatTime(_performedAt),
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _arena,
          style: const TextStyle(color: AppColors.tabInactive, fontSize: 16),
          decoration: fieldDecoration(
            'Arena',
            suffixIcon: _fieldIcon(AppIconAsset.pin, faded: false),
          ),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _controllerField,
          style: const TextStyle(color: AppColors.tabInactive, fontSize: 16),
          onChanged: (v) {
            final handle = v.trim();
            _controllerHandle = handle.isEmpty ? null : handle;
          },
          decoration: fieldDecoration('Controller', hintText: '#RicNil123456')
              .copyWith(
                // Tapping search opens the picker, which fetches the coach /
                // teammate / participant list.
                suffixIcon: Padding(
                  padding: const EdgeInsets.only(right: 15),
                  child: InkResponse(
                    onTap: _pickController,
                    radius: 20,
                    child: const Icon(
                      Icons.search_rounded,
                      size: 20,
                      color: AppColors.pillEquipment,
                    ),
                  ),
                ),
                suffixIconConstraints: const BoxConstraints(
                  maxWidth: 40,
                  maxHeight: 24,
                ),
              ),
        ),
        // TODO(figma): "Share to my feed" is not part of the current result-form
        // design — hidden for now. Re-enable with [_ShareToFeedToggle].
        // const SizedBox(height: 20),
        // _ShareToFeedToggle(
        //   value: _shareToFeed,
        //   onChanged: (v) => setState(() => _shareToFeed = v),
        // ),
        const SizedBox(height: 26),
        PrimaryButton(
          label: 'Save',
          isLoading: _submitting,
          onPressed: _submit,
        ),
      ],
    );
  }

  Widget _numberInput() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _value,
            keyboardType: TextInputType.numberWithOptions(
              decimal: _strategy.allowsDecimal,
            ),
            textAlign: TextAlign.right,
            style: const TextStyle(
              color: AppColors.fgStrong,
              fontSize: 16,
              fontWeight: FontWeight.w400,
            ),
            decoration: InputDecoration(
              isCollapsed: true,
              border: InputBorder.none,
              hintText: _strategy.hint,
              hintStyle: const TextStyle(color: AppColors.faint, fontSize: 14),
            ),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          c.resultUnit.short,
          style: const TextStyle(color: AppColors.fgStrong, fontSize: 16),
        ),
        const SizedBox(width: 16),
        Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _StepArrow(asset: AppIconAsset.up, onTap: () => _step(1)),
            const SizedBox(height: 4),
            _StepArrow(asset: AppIconAsset.down, onTap: () => _step(-1)),
          ],
        ),
      ],
    );
  }

  Widget _toggleInput() {
    return Row(
      children: [
        Text(
          _toggle ? 'Completed' : 'Not completed',
          style: const TextStyle(color: AppColors.fg, fontSize: 16),
        ),
        const Spacer(),
        Switch(
          value: _toggle,
          activeThumbColor: AppColors.success,
          onChanged: (v) => setState(() => _toggle = v),
        ),
      ],
    );
  }
}

class _StepArrow extends StatelessWidget {
  const _StepArrow({required this.asset, required this.onTap});

  final AppIconAsset asset;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    // The up / down SVGs bake in their own 50% opacity.
    child: AppIcon(asset, size: 9, color: AppColors.pillEquipment),
  );
}

// "Share to my feed" recognition-concept toggle — hidden until the result-form
// design brings it back. The `shareToFeed` flag still ships with the submission
// (always false for now); restore the widget below and its call site in `_form`.
/*
/// "Share to my feed" recognition concept toggle. The flag is persisted with the
/// result; there is no feed pipeline in this slice (documented as a next step).
class _ShareToFeedToggle extends StatelessWidget {
  const _ShareToFeedToggle({required this.value, required this.onChanged});

  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Share to my feed',
                style: TextStyle(color: AppColors.fg, fontSize: 16),
              ),
              SizedBox(height: 2),
              Text(
                'Posts to your Zporter feed once the result is verified',
                style: TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
        Switch(
          value: value,
          activeThumbColor: AppColors.success,
          onChanged: onChanged,
        ),
      ],
    );
  }
}
*/

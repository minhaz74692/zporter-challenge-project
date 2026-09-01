import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/router/app_routes.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/primary_button.dart';
import '../application/auth_notifier.dart';
import '../data/auth_providers.dart';
import '../domain/team_option.dart';
import 'widgets/auth_scaffold.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  String? _teamId;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  void _submit() {
    if (_formKey.currentState?.validate() ?? false) {
      ref.read(authNotifierProvider.notifier).register(
        displayName: _name.text.trim(),
        email: _email.text.trim(),
        password: _password.text,
        teamId: _teamId!,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authNotifierProvider, (_, next) {
      final error = next.error;
      if (error is ApiException) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(content: Text(error.message)));
      }
    });

    final isBusy = ref.watch(authNotifierProvider).isLoading;
    final teams = ref.watch(teamsProvider);

    return AuthScaffold(
      title: 'Create your account',
      subtitle: 'Join your team and start competing.',
      footer: TextButton(
        onPressed: isBusy ? null : () => context.go(AppRoutes.login),
        child: const Text('Already have an account? Sign in'),
      ),
      children: [
        Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              TextFormField(
                controller: _name,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(hintText: 'Display name'),
                validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Enter your name' : null,
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                decoration: const InputDecoration(hintText: 'Email'),
                validator: (v) =>
                    (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
              ),
              const SizedBox(height: AppSpacing.md),
              TextFormField(
                controller: _password,
                obscureText: true,
                decoration: const InputDecoration(
                  hintText: 'Password (min 8 characters)',
                ),
                onFieldSubmitted: (_) => _submit(),
                validator: (v) => (v == null || v.length < 8)
                    ? 'At least 8 characters'
                    : null,
              ),
              const SizedBox(height: AppSpacing.md),
              _TeamField(
                teams: teams,
                value: _teamId,
                onChanged: (id) => setState(() => _teamId = id),
                onRetry: () => ref.invalidate(teamsProvider),
              ),
              const SizedBox(height: AppSpacing.xl),
              PrimaryButton(
                label: 'Create account',
                isLoading: isBusy,
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Team picker for signup — a dropdown once the directory loads, with inline
/// spinner / retry while it is pending or failed.
class _TeamField extends StatelessWidget {
  const _TeamField({
    required this.teams,
    required this.value,
    required this.onChanged,
    required this.onRetry,
  });

  final AsyncValue<List<TeamOption>> teams;
  final String? value;
  final ValueChanged<String?> onChanged;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return teams.when(
      loading: () => const InputDecorator(
        decoration: InputDecoration(hintText: 'Team'),
        child: Row(
          children: [
            SizedBox(
              height: 16,
              width: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(width: AppSpacing.sm),
            Text('Loading teams…'),
          ],
        ),
      ),
      error: (_, __) => InputDecorator(
        decoration: const InputDecoration(hintText: 'Team'),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Flexible(child: Text('Could not load teams')),
            TextButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
      data: (list) => DropdownButtonFormField<String>(
        initialValue: value,
        isExpanded: true,
        decoration: const InputDecoration(hintText: 'Select your team'),
        items: [
          for (final team in list)
            DropdownMenuItem<String>(
              value: team.id,
              child: Text(
                team.coachName.isEmpty
                    ? team.name
                    : '${team.name}  ·  ${team.coachName}',
                overflow: TextOverflow.ellipsis,
              ),
            ),
        ],
        onChanged: onChanged,
        validator: (v) => (v == null || v.isEmpty) ? 'Choose your team' : null,
      ),
    );
  }
}

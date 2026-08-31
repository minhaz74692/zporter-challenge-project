import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Shared decoration for the outlined "notched label" fields on the Figma
/// forms (Add result, Filter). Pass to a `TextFormField`, or wrap arbitrary
/// content with [LabeledField].
InputDecoration fieldDecoration(
  String label, {
  bool accent = false,
  Widget? suffixIcon,
  String? hintText,
}) {
  final color = accent ? AppColors.primary : AppColors.pillEquipment;
  OutlineInputBorder border(Color c) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(12),
    borderSide: BorderSide(color: c),
  );

  return InputDecoration(
    labelText: label,
    hintText: hintText,
    filled: false,
    floatingLabelBehavior: FloatingLabelBehavior.always,
    isDense: true,
    labelStyle: TextStyle(
      color: accent ? AppColors.primary : AppColors.muted,
      fontSize: 13,
    ),
    hintStyle: const TextStyle(color: AppColors.faint),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    suffixIcon: suffixIcon,
    suffixIconColor: AppColors.muted,
    enabledBorder: border(color),
    focusedBorder: border(AppColors.primary),
    border: border(color),
  );
}

/// A tap-to-open field (date, time, …): the [fieldDecoration] chrome around a
/// static [child], with an optional [onTap].
class LabeledField extends StatelessWidget {
  const LabeledField({
    required this.label,
    required this.child,
    this.onTap,
    this.trailing,
    this.accent = false,
    super.key,
  });

  final String label;
  final Widget child;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool accent;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: InputDecorator(
        decoration: fieldDecoration(label, accent: accent, suffixIcon: trailing),
        child: DefaultTextStyle.merge(
          style: const TextStyle(color: AppColors.fg, fontSize: 16),
          child: child,
        ),
      ),
    );
  }
}

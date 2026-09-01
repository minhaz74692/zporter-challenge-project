import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Shared decoration for the outlined "notched label" fields on the Figma
/// forms (Add result, Filter). Pass to a `TextFormField`, or wrap arbitrary
/// content with [LabeledField].
///
/// Figma: 4px corners, a 1px hairline outline at 30% opacity (blue on the
/// [accent] field, `#818389` grey elsewhere), and a 14px label — `#4654EA` on
/// the accent field, `#4A4C51` elsewhere. Focus firms the outline to solid blue.
InputDecoration fieldDecoration(
  String label, {
  bool accent = false,
  Widget? suffixIcon,
  String? hintText,
}) {
  final base = accent ? AppColors.primary : AppColors.pillEquipment;
  OutlineInputBorder border(Color c) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(4),
    borderSide: BorderSide(color: c),
  );

  return InputDecoration(
    labelText: label,
    hintText: hintText,
    filled: false,
    floatingLabelBehavior: FloatingLabelBehavior.always,
    isDense: true,
    // Figma: the accent ("Challenge result") label is 16px blue; the rest are
    // 14px `#4A4C51`.
    labelStyle: TextStyle(
      color: accent ? AppColors.primary : AppColors.fieldOutline,
      fontSize: accent ? 16 : 14,
    ),
    hintStyle: const TextStyle(color: AppColors.faint),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    suffixIcon: suffixIcon,
    suffixIconColor: AppColors.pillEquipment.withValues(alpha: 0.5),
    // Without this the icon slot keeps its 48x48 interactive minimum, and a
    // `BoxFit.contain` SVG scales up to fill it. Cap it at the glyph size plus
    // the 15px right margin the trailing icons carry (see `_fieldIcon`).
    suffixIconConstraints: const BoxConstraints(maxWidth: 35, maxHeight: 22),
    enabledBorder: border(base.withValues(alpha: 0.3)),
    focusedBorder: border(AppColors.primary),
    border: border(base.withValues(alpha: 0.3)),
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
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: fieldDecoration(
          label,
          accent: accent,
          suffixIcon: trailing,
        ),
        child: DefaultTextStyle.merge(
          // Figma: field values render in the same `#818389` grey as the mock.
          style: const TextStyle(color: AppColors.tabInactive, fontSize: 16),
          child: child,
        ),
      ),
    );
  }
}

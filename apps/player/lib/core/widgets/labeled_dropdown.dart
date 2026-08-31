import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// An outlined select with the label notched into the top border and a large
/// value — the field style used on the Figma "Filter Challenges" sheet.
class LabeledDropdown<T> extends StatelessWidget {
  const LabeledDropdown({
    required this.label,
    required this.value,
    required this.items,
    required this.itemLabel,
    required this.onChanged,
    super.key,
  });

  final String label;
  final T value;
  final List<T> items;
  final String Function(T value) itemLabel;
  final ValueChanged<T?> onChanged;

  @override
  Widget build(BuildContext context) {
    OutlineInputBorder border(Color color) => OutlineInputBorder(
      borderRadius: BorderRadius.circular(12),
      borderSide: BorderSide(color: color),
    );

    return DropdownButtonFormField<T>(
      initialValue: value,
      isExpanded: true,
      dropdownColor: AppColors.surfaceRaised,
      borderRadius: BorderRadius.circular(12),
      icon: const Icon(
        Icons.keyboard_arrow_down_rounded,
        color: AppColors.muted,
      ),
      style: const TextStyle(
        color: AppColors.fg,
        fontSize: 17,
        fontWeight: FontWeight.w500,
      ),
      decoration: InputDecoration(
        labelText: label,
        filled: false,
        floatingLabelBehavior: FloatingLabelBehavior.always,
        labelStyle: const TextStyle(color: AppColors.muted, fontSize: 13),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
        enabledBorder: border(AppColors.pillEquipment),
        focusedBorder: border(AppColors.primary),
        border: border(AppColors.pillEquipment),
      ),
      items: [
        for (final item in items)
          DropdownMenuItem<T>(value: item, child: Text(itemLabel(item))),
      ],
      onChanged: onChanged,
    );
  }
}

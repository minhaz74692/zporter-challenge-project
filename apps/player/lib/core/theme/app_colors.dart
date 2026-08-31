import 'package:flutter/material.dart';

/// The single source of truth for colour in the app.
///
/// Values are copied verbatim from the web creator app's design tokens
/// (`apps/web/src/app/globals.css` `@theme` block) so the two clients render
/// the same Zporter palette. Names here are *semantic* (what the colour is
/// for), not descriptive (what hue it is) — screens reference `AppColors.danger`,
/// never a raw hex.
abstract final class AppColors {
  // Surfaces, from furthest-back to nearest-front.
  static const bg = Color(0xFF000000);
  static const canvas = Color(0xFF111115);
  static const surface = Color(0xFF14151A);
  static const surfaceRaised = Color(0xFF1C1D23);
  static const surfaceOverlay = Color(0xFF24252D);
  static const field = Color(0xFF202128);

  static const border = Color(0xFF24252D);
  static const borderSoft = Color(0xFF1E1F26);

  // Challenge card body — a top-to-bottom gradient (from the Figma card fill).
  static const cardTop = Color(0xFF13161A);
  static const cardBottom = Color(0xFF0D0F12);

  // Text, from most to least prominent.
  static const fg = Color(0xFFF3F4F7);
  static const muted = Color(0xFF8A8F9C);
  static const faint = Color(0xFF5C606C);

  // Actions / status.
  static const primary = Color(0xFF4E5BF2); // primary CTA — "Open", "Accept"
  static const primaryHover = Color(0xFF4049D6);
  static const accent = Color(0xFFFFA333); // active / selected
  static const accentHover = Color(0xFFFF9314);
  static const success = Color(0xFF25D07D); // "Done", completion, current user
  static const danger = Color(0xFFF5484A); // "Decline", destructive

  // Pills.
  static const pillEquipment = Color(0xFF3A3C46); // grey — equipment tags
  static const pillSkill = primary; // blue — skill / collection tags

  // Leaderboard medals.
  static const medalGold = Color(0xFFF5C451);
  static const medalSilver = Color(0xFFC7CCD6);
  static const medalBronze = Color(0xFFCD7F42);

  /// The lavender row index on the participants list.
  static const indexLavender = Color(0xFFB9A7F0);

  static const onPrimary = Color(0xFFFFFFFF);
}

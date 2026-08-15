import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color ink950 = Color(0xFF0A0D11);
  static const Color ink900 = Color(0xFF11161B);
  static const Color ink800 = Color(0xFF1A2027);
  static const Color ink700 = Color(0xFF2A323A);
  static const Color ink600 = Color(0xFF39434C);
  static const Color ink500 = Color(0xFF4D5964);
  static const Color ink400 = Color(0xFF6F7B87);
  static const Color ink300 = Color(0xFFA2ABB4);
  static const Color ink200 = Color(0xFFC9CED3);
  static const Color ink100 = Color(0xFFE6E8EA);
  static const Color ink50 = Color(0xFFF5F6F7);

  static const Color sand50 = Color(0xFFFBF8F3);
  static const Color sand100 = Color(0xFFF4EDE1);

  static const Color accent600 = Color(0xFFEC6107);
  static const Color accent500 = Color(0xFFFB7D11);
  static const Color accent400 = Color(0xFFFD9A37);
  static const Color accent300 = Color(0xFFFFBF70);

  static const Color emerald600 = Color(0xFF059669);
  static const Color emerald400 = Color(0xFF34D399);

  static const List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Color(0x0A101828),
      blurRadius: 2,
      offset: Offset(0, 1),
    ),
    BoxShadow(
      color: Color(0x1F101828),
      blurRadius: 24,
      offset: Offset(0, 8),
      spreadRadius: -12,
    ),
  ];

  static TextTheme _textTheme(Brightness brightness) {
    final base = GoogleFonts.plusJakartaSansTextTheme(
      brightness == Brightness.dark ? ThemeData.dark().textTheme : ThemeData.light().textTheme,
    );
    return base.copyWith(
      headlineLarge: base.headlineLarge?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.5),
      headlineMedium: base.headlineMedium?.copyWith(fontWeight: FontWeight.w800, letterSpacing: -0.3),
      titleLarge: base.titleLarge?.copyWith(fontWeight: FontWeight.w800),
      titleMedium: base.titleMedium?.copyWith(fontWeight: FontWeight.w700),
      labelLarge: base.labelLarge?.copyWith(fontWeight: FontWeight.w700),
    );
  }

  static ThemeData light() => _buildTheme(
        brightness: Brightness.light,
        scaffold: sand50,
        surface: Colors.white,
        onSurface: ink900,
        cardColor: Colors.white,
        borderColor: ink100,
        navBg: Colors.white.withValues(alpha: 0.95),
      );

  static ThemeData dark() => _buildTheme(
        brightness: Brightness.dark,
        scaffold: const Color(0xFF0D1117),
        surface: const Color(0xFF161B22),
        onSurface: const Color(0xFFEEF1F4),
        cardColor: const Color(0xFF161B22),
        borderColor: const Color(0xFF232B35),
        navBg: const Color(0xFF161B22).withValues(alpha: 0.95),
      );

  static ThemeData _buildTheme({
    required Brightness brightness,
    required Color scaffold,
    required Color surface,
    required Color onSurface,
    required Color cardColor,
    required Color borderColor,
    required Color navBg,
  }) {
    final isDark = brightness == Brightness.dark;
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: scaffold,
      fontFamily: GoogleFonts.plusJakartaSans().fontFamily,
      textTheme: _textTheme(brightness),
      colorScheme: ColorScheme.fromSeed(
        seedColor: accent500,
        brightness: brightness,
        primary: isDark ? accent500 : ink900,
        secondary: accent500,
        surface: surface,
        onSurface: onSurface,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: onSurface,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.plusJakartaSans(
          fontSize: 18,
          fontWeight: FontWeight.w800,
          color: onSurface,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: navBg,
        indicatorColor: accent500.withValues(alpha: 0.15),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return GoogleFonts.plusJakartaSans(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: selected ? onSurface : ink300,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: selected ? onSurface : ink300,
            size: 20,
          );
        }),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: borderColor),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accent400, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: isDark ? accent500 : ink900,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: accent500,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: onSurface,
          side: BorderSide(color: borderColor),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: cardColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: borderColor),
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: isDark ? ink800 : ink50,
        selectedColor: isDark ? ink900 : ink900,
        labelStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w700, fontSize: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        side: BorderSide.none,
      ),
      dividerTheme: DividerThemeData(color: borderColor, thickness: 1),
    );
  }

  static BoxDecoration cardDecoration(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return BoxDecoration(
      color: Theme.of(context).cardColor,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: isDark ? ink700 : ink100),
      boxShadow: isDark ? null : cardShadow,
    );
  }

  static Color contentBackground(BuildContext context) {
    return Theme.of(context).brightness == Brightness.dark
        ? const Color(0xFF0D1117)
        : sand50;
  }
}

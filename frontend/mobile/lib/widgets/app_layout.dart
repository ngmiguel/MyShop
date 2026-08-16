import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';

class HeroHeader extends StatelessWidget {
  const HeroHeader({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.fromLTRB(16, 16, 16, 20),
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: AppTheme.ink900,
      padding: padding,
      child: SafeArea(
        bottom: false,
        child: DefaultTextStyle(
          style: const TextStyle(color: Colors.white),
          child: child,
        ),
      ),
    );
  }
}

class ContentSheet extends StatelessWidget {
  const ContentSheet({
    super.key,
    required this.child,
    this.padding = EdgeInsets.zero,
  });

  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    return Transform.translate(
      offset: const Offset(0, -12),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: AppTheme.contentBackground(context),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: padding,
        child: child,
      ),
    );
  }
}

class AppChip extends StatelessWidget {
  const AppChip({
    super.key,
    required this.label,
    required this.active,
    required this.onTap,
    this.leading,
    this.bold = false,
    this.dense = false,
  });

  final Widget label;
  final bool active;
  final VoidCallback onTap;
  final Widget? leading;
  final bool bold;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Material(
      color: active
          ? AppTheme.ink900
          : (isDark ? AppTheme.ink800 : Colors.white),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: EdgeInsets.symmetric(
            horizontal: dense ? 10 : 14,
            vertical: dense ? 5 : 8,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: active
                  ? AppTheme.ink900
                  : (isDark ? AppTheme.ink700 : AppTheme.ink100),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (leading != null) ...[leading!, const SizedBox(width: 6)],
              DefaultTextStyle(
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: bold || active ? FontWeight.w800 : FontWeight.w700,
                  color: active
                      ? Colors.white
                      : (isDark ? AppTheme.ink300 : AppTheme.ink500),
                ),
                child: label,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ThemeSelector extends StatelessWidget {
  const ThemeSelector({
    super.key,
    required this.value,
    required this.onChanged,
  });

  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _Option(
          icon: Icons.light_mode_outlined,
          label: 'Clair',
          selected: value == 'clair',
          onTap: () => onChanged('clair'),
        ),
        const SizedBox(width: 8),
        _Option(
          icon: Icons.dark_mode_outlined,
          label: 'Sombre',
          selected: value == 'sombre',
          onTap: () => onChanged('sombre'),
        ),
        const SizedBox(width: 8),
        _Option(
          icon: Icons.monitor_outlined,
          label: 'Systeme',
          selected: value == 'systeme',
          onTap: () => onChanged('systeme'),
        ),
      ],
    );
  }
}

class _Option extends StatelessWidget {
  const _Option({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Material(
        color: selected
            ? AppTheme.accent500.withValues(alpha: 0.15)
            : Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: selected ? AppTheme.accent500 : AppTheme.ink100,
              ),
            ),
            child: Column(
              children: [
                Icon(icon, size: 20, color: selected ? AppTheme.accent500 : AppTheme.ink400),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: selected ? AppTheme.accent600 : AppTheme.ink500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class SettingsSection extends StatelessWidget {
  const SettingsSection({
    super.key,
    required this.title,
    required this.children,
  });

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.2,
              color: AppTheme.ink400,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: AppTheme.cardDecoration(context),
            clipBehavior: Clip.antiAlias,
            child: Column(children: children),
          ),
        ],
      ),
    );
  }
}

class SettingsTile extends StatelessWidget {
  const SettingsTile({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.showDivider = true,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        ListTile(
          leading: Icon(icon, color: AppTheme.ink500, size: 20),
          title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          subtitle: subtitle != null
              ? Text(subtitle!, style: const TextStyle(fontSize: 12, color: AppTheme.ink400))
              : null,
          trailing: trailing ?? (onTap != null ? const Icon(Icons.chevron_right, size: 18) : null),
          onTap: onTap,
        ),
        if (showDivider) const Divider(height: 1, indent: 56),
      ],
    );
  }
}

class HorizontalChipList extends StatelessWidget {
  const HorizontalChipList({super.key, required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            if (i > 0) const SizedBox(width: 8),
            children[i],
          ],
        ],
      ),
    );
  }
}

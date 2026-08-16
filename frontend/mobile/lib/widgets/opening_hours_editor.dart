import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../data/models/store.dart';

class OpeningHoursEditor extends StatelessWidget {
  const OpeningHoursEditor({
    super.key,
    required this.hours,
    required this.onChanged,
  });

  final List<OpeningHoursDay> hours;
  final ValueChanged<List<OpeningHoursDay>> onChanged;

  @override
  Widget build(BuildContext context) {
    final list = hours.isEmpty ? defaultOpeningHours() : hours;

    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppTheme.ink100),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          for (var i = 0; i < list.length; i++) ...[
            if (i > 0) const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  SizedBox(
                    width: 72,
                    child: Text(list[i].day, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                  ),
                  if (list[i].closed)
                    const Expanded(
                      child: Text('Fermé', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFDC2626))),
                    )
                  else ...[
                    Expanded(
                      child: _TimeButton(
                        value: list[i].open,
                        onPick: (v) {
                          final next = [...list];
                          next[i] = list[i].copyWith(open: v);
                          onChanged(next);
                        },
                      ),
                    ),
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 4),
                      child: Text('–', style: TextStyle(color: AppTheme.ink300)),
                    ),
                    Expanded(
                      child: _TimeButton(
                        value: list[i].close,
                        onPick: (v) {
                          final next = [...list];
                          next[i] = list[i].copyWith(close: v);
                          onChanged(next);
                        },
                      ),
                    ),
                  ],
                  const SizedBox(width: 6),
                  OutlinedButton(
                    onPressed: () {
                      final next = [...list];
                      next[i] = list[i].copyWith(closed: !list[i].closed);
                      onChanged(next);
                    },
                    style: OutlinedButton.styleFrom(
                      visualDensity: VisualDensity.compact,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                    ),
                    child: Text(list[i].closed ? 'Ouvrir' : 'Fermer', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class OpeningHoursView extends StatelessWidget {
  const OpeningHoursView({super.key, required this.hours});

  final List<OpeningHoursDay> hours;

  @override
  Widget build(BuildContext context) {
    final list = hours.isEmpty ? defaultOpeningHours() : hours;
    return Container(
      decoration: AppTheme.cardDecoration(context),
      child: Column(
        children: [
          for (var i = 0; i < list.length; i++) ...[
            if (i > 0) const Divider(height: 1, indent: 16),
            ListTile(
              dense: true,
              title: Text(list[i].day, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              trailing: Text(
                list[i].closed ? 'Fermé' : '${list[i].open} – ${list[i].close}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: list[i].closed ? const Color(0xFFDC2626) : AppTheme.ink700,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _TimeButton extends StatelessWidget {
  const _TimeButton({required this.value, required this.onPick});

  final String value;
  final ValueChanged<String> onPick;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () async {
        final parts = value.split(':');
        final initial = TimeOfDay(
          hour: int.tryParse(parts.first) ?? 8,
          minute: int.tryParse(parts.length > 1 ? parts[1] : '30') ?? 30,
        );
        final picked = await showTimePicker(context: context, initialTime: initial);
        if (picked != null) {
          final h = picked.hour.toString().padLeft(2, '0');
          final m = picked.minute.toString().padLeft(2, '0');
          onPick('$h:$m');
        }
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.ink100),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(value, textAlign: TextAlign.center, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
      ),
    );
  }
}

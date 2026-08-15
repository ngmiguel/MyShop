import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/preferences.dart';
import '../../providers/preferences_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/top_bar.dart';

class PreferencesScreen extends StatefulWidget {
  const PreferencesScreen({super.key});

  @override
  State<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends State<PreferencesScreen> {
  late String _intention;
  late Set<String> _domains;
  late Set<String> _subcategories;
  late String _budget;
  late String _city;
  late double _radiusKm;
  late String _preferredMode;
  late bool _promosOnly;
  late bool _localOnly;

  @override
  void initState() {
    super.initState();
    final p = context.read<PreferencesProvider>().preferences;
    _intention = p.intention;
    _domains = p.domains.toSet();
    _subcategories = p.subcategories.toSet();
    _budget = p.budget;
    _city = p.city;
    _radiusKm = p.radiusKm.toDouble();
    _preferredMode = p.preferredMode;
    _promosOnly = p.promosOnly;
    _localOnly = p.localOnly;
  }

  Future<void> _save() async {
    final prefs = UserPreferences(
      onboardingDone: true,
      intention: _intention,
      domains: _domains.toList(),
      subcategories: _subcategories.toList(),
      budget: _budget,
      city: _city,
      radiusKm: _radiusKm.round(),
      preferredMode: _preferredMode,
      promosOnly: _promosOnly,
      localOnly: _localOnly,
      themeMode: context.read<PreferencesProvider>().preferences.themeMode,
    );
    await context.read<PreferencesProvider>().update(prefs);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Preferences enregistrees')),
      );
      context.go('/client');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: const TopBar(title: 'Preferences', subtitle: 'Personnaliser mon flux'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
        children: [
          const SectionHeader(title: 'Intention'),
          ...intentions.map((item) {
            final selected = _intention == item.$1;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: selected ? AppTheme.accent500 : AppTheme.ink100),
                ),
                leading: Icon(item.$3),
                title: Text(item.$2, style: const TextStyle(fontWeight: FontWeight.w700)),
                trailing: selected ? const Icon(Icons.check, color: AppTheme.accent500) : null,
                onTap: () => setState(() => _intention = item.$1),
              ),
            );
          }),
          SectionHeader(title: 'Univers (${_domains.length})'),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: domainCategories.map((d) {
              final selected = _domains.contains(d.id);
              return FilterChip(
                avatar: Icon(d.icon, size: 16),
                label: Text(d.name),
                selected: selected,
                onSelected: (_) {
                  setState(() {
                    if (selected) {
                      _domains.remove(d.id);
                      _subcategories.removeWhere(d.subcategories.contains);
                    } else {
                      _domains.add(d.id);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SectionHeader(title: 'Budget & zone'),
          Container(
            decoration: AppTheme.cardDecoration(context),
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  initialValue: _budget,
                  decoration: const InputDecoration(labelText: 'Budget par article'),
                  items: budgets.map((b) => DropdownMenuItem(value: b.$1, child: Text(b.$2))).toList(),
                  onChanged: (v) => setState(() => _budget = v ?? _budget),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: _city,
                  decoration: const InputDecoration(labelText: 'Ville'),
                  items: ['Abidjan', 'Bouake', 'Yamoussoukro']
                      .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                      .toList(),
                  onChanged: (v) => setState(() => _city = v ?? _city),
                ),
                Text('Rayon: ${_radiusKm.round()} km'),
                Slider(value: _radiusKm, min: 2, max: 60, divisions: 58, onChanged: (v) => setState(() => _radiusKm = v)),
                SwitchListTile(
                  title: const Text('Promotions en avant'),
                  value: _promosOnly,
                  onChanged: (v) => setState(() => _promosOnly = v),
                ),
                SwitchListTile(
                  title: const Text('Boutiques de ma ville'),
                  value: _localOnly,
                  onChanged: (v) => setState(() => _localOnly = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () => context.go('/onboarding'),
            icon: const Icon(Icons.refresh),
            label: const Text('Reinitialiser l\'onboarding'),
          ),
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: FilledButton(onPressed: _domains.length >= 3 ? _save : null, child: const Text('Enregistrer')),
        ),
      ),
    );
  }
}

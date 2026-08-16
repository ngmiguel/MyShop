import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/preferences.dart';
import '../../providers/preferences_provider.dart';
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

  List<DomainCategory> get _availableDomains {
    return domainCategories.where((d) => _domains.contains(d.id)).toList();
  }

  void _toggleDomain(String id) {
    final domain = domainById(id);
    setState(() {
      if (_domains.contains(id)) {
        _domains.remove(id);
        if (domain != null) {
          _subcategories.removeWhere(domain.subcategories.contains);
        }
      } else {
        _domains.add(id);
      }
    });
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
        const SnackBar(content: Text('Préférences mises à jour — votre flux est réorganisé.')),
      );
      context.go('/client');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: const TopBar(title: 'Mes préférences', subtitle: 'Ce qui alimente votre flux'),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 120),
        children: [
          const SectionHeader(title: 'Mon intention'),
          ...intentions.map((item) {
            final selected = _intention == item.$1;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Material(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                child: InkWell(
                  onTap: () => setState(() => _intention = item.$1),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: selected ? AppTheme.accent400 : AppTheme.ink100),
                      boxShadow: AppTheme.cardShadow,
                    ),
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Icon(item.$3, size: 20, color: selected ? AppTheme.accent500 : AppTheme.ink500),
                        const SizedBox(width: 12),
                        Expanded(child: Text(item.$2, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13))),
                        if (selected) const Icon(Icons.check, size: 16, color: AppTheme.accent500),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
          SectionHeader(
            title: 'Mes univers (${_domains.length}/18)',
            action: TextButton(
              onPressed: () => setState(() {
                _domains.clear();
                _subcategories.clear();
              }),
              child: const Text('Tout retirer', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.accent600)),
            ),
          ),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 0.95,
            ),
            itemCount: domainCategories.length,
            itemBuilder: (context, index) {
              final domain = domainCategories[index];
              final selected = _domains.contains(domain.id);
              return Material(
                color: selected ? AppTheme.accent500.withValues(alpha: 0.08) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                child: InkWell(
                  onTap: () => _toggleDomain(domain.id),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: selected ? AppTheme.accent400 : AppTheme.ink100),
                      boxShadow: AppTheme.cardShadow,
                    ),
                    padding: const EdgeInsets.all(8),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(domain.icon, size: 24, color: selected ? AppTheme.accent500 : AppTheme.ink500),
                        const SizedBox(height: 6),
                        Text(
                          domain.name,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, height: 1.2),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
          if (_availableDomains.isNotEmpty) ...[
            SectionHeader(title: 'Mes rayons (${_subcategories.length})'),
            ..._availableDomains.map((domain) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      domain.name.toUpperCase(),
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 0.4, color: AppTheme.ink400),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: domain.subcategories.map((sub) {
                        final selected = _subcategories.contains(sub);
                        return FilterChip(
                          label: Text(sub, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: selected ? Colors.white : AppTheme.ink600)),
                          selected: selected,
                          onSelected: (_) {
                            setState(() {
                              if (selected) {
                                _subcategories.remove(sub);
                              } else {
                                _subcategories.add(sub);
                              }
                            });
                          },
                          selectedColor: AppTheme.ink900,
                          backgroundColor: Colors.white,
                          side: BorderSide(color: selected ? AppTheme.ink900 : AppTheme.ink200),
                          showCheckmark: false,
                        );
                      }).toList(),
                    ),
                  ],
                ),
              );
            }),
          ],
          Container(
            margin: const EdgeInsets.only(top: 8),
            decoration: AppTheme.cardDecoration(context),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Budget & zone', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                const SizedBox(height: 12),
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
                  items: onboardingCities.map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
                  onChanged: (v) => setState(() => _city = v ?? _city),
                ),
                const SizedBox(height: 8),
                Text('Rayon : ${_radiusKm.round()} km', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                Slider(
                  value: _radiusKm,
                  min: 2,
                  max: 60,
                  divisions: 58,
                  activeColor: AppTheme.accent500,
                  onChanged: (v) => setState(() => _radiusKm = v),
                ),
                DropdownButtonFormField<String>(
                  initialValue: _preferredMode,
                  decoration: const InputDecoration(labelText: 'Mode préféré'),
                  items: const [
                    DropdownMenuItem(value: 'peu-importe', child: Text('Peu importe')),
                    DropdownMenuItem(value: 'retrait', child: Text('Retrait en boutique')),
                    DropdownMenuItem(value: 'livraison', child: Text('Livraison')),
                  ],
                  onChanged: (v) => setState(() => _preferredMode = v ?? _preferredMode),
                ),
                const Divider(height: 24),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Mettre les promotions en avant', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  value: _promosOnly,
                  onChanged: (v) => setState(() => _promosOnly = v),
                ),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Privilégier ma ville', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                  value: _localOnly,
                  onChanged: (v) => setState(() => _localOnly = v),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: () async {
              await context.read<PreferencesProvider>().update(
                    context.read<PreferencesProvider>().preferences.copyWith(onboardingDone: false),
                  );
              if (context.mounted) context.go('/onboarding');
            },
            icon: const Icon(Icons.refresh, size: 15),
            label: const Text('Refaire le questionnaire d\'accueil'),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppTheme.ink100))),
        padding: const EdgeInsets.all(12),
        child: SafeArea(
          top: false,
          child: FilledButton(
            onPressed: _domains.length >= 3 ? _save : null,
            style: FilledButton.styleFrom(backgroundColor: AppTheme.ink900, minimumSize: const Size.fromHeight(48)),
            child: const Text('Enregistrer mes préférences', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ),
      ),
    );
  }
}

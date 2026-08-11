import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../data/models/preferences.dart';
import '../../providers/preferences_provider.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  static const _titles = [
    'Bienvenue',
    'Votre intention',
    'Vos univers',
    'Vos rayons',
    'Votre budget',
    'Votre zone',
    'Derniers reglages',
  ];

  int _step = 0;
  String _intention = 'quotidien';
  final Set<String> _domains = {};
  final Set<String> _subcategories = {};
  String _budget = 'illimite';
  String _city = 'Abidjan';
  double _radiusKm = 15;
  String _preferredMode = 'peu-importe';
  bool _promosOnly = false;
  bool _localOnly = true;

  bool get _canContinue => _step != 2 || _domains.length >= 3;

  List<String> get _availableSubcategories {
    return domainCategories
        .where((d) => _domains.contains(d.id))
        .expand((d) => d.subcategories)
        .toList();
  }

  Future<void> _finish({bool skip = false}) async {
    final prefs = UserPreferences(
      onboardingDone: true,
      intention: _intention,
      domains: skip && _domains.isEmpty ? ['agro', 'technologie', 'style'] : _domains.toList(),
      subcategories: skip ? [] : _subcategories.toList(),
      budget: _budget,
      city: _city,
      radiusKm: _radiusKm.round(),
      preferredMode: _preferredMode,
      promosOnly: _promosOnly,
      localOnly: _localOnly,
    );
    await context.read<PreferencesProvider>().completeOnboarding(prefs);
    if (mounted) context.go('/client');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.ink900,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Etape ${_step + 1}/7 - ${_titles[_step]}',
                        style: const TextStyle(
                          color: AppTheme.accent400,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton(
                        onPressed: () => _finish(skip: true),
                        child: const Text('Passer', style: TextStyle(color: Colors.white70)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: List.generate(
                      _titles.length,
                      (i) => Expanded(
                        child: Container(
                          height: 4,
                          margin: EdgeInsets.only(right: i < _titles.length - 1 ? 4 : 0),
                          decoration: BoxDecoration(
                            color: i <= _step ? AppTheme.accent500 : AppTheme.ink700,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(child: _buildStep()),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_step > 0)
                    OutlinedButton(
                      onPressed: () => setState(() => _step--),
                      style: OutlinedButton.styleFrom(foregroundColor: Colors.white),
                      child: const Text('Retour'),
                    ),
                  if (_step > 0) const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _canContinue
                          ? () {
                              if (_step == 6) {
                                _finish();
                              } else {
                                setState(() => _step++);
                              }
                            }
                          : null,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.accent500,
                        foregroundColor: Colors.white,
                      ),
                      child: Text(_step == 0
                          ? 'Commencer'
                          : _step == 6
                              ? 'Voir mon flux'
                              : 'Continuer'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _welcomeStep();
      case 1:
        return _intentionStep();
      case 2:
        return _domainsStep();
      case 3:
        return _subcategoriesStep();
      case 4:
        return _budgetStep();
      case 5:
        return _locationStep();
      default:
        return _finalStep();
    }
  }

  Widget _welcomeStep() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.accent500,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.auto_awesome_outlined, color: Colors.white, size: 32),
          ),
          const SizedBox(height: 24),
          const Text(
            'Des milliers d\'articles.\nUn flux fait pour vous.',
            style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 12),
          const Text(
            'Agroalimentaire, vehicules, materiaux, technologie, style... Repondez a 6 questions rapides pour personnaliser votre experience.',
            style: TextStyle(color: Colors.white70, height: 1.5),
          ),
          const SizedBox(height: 20),
          ...[
            'Choisissez vos univers de vente',
            'Affinez par rayon precis',
            'Fixez votre budget et votre zone',
          ].map(
            (t) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  const Icon(Icons.check, color: AppTheme.accent400, size: 18),
                  const SizedBox(width: 8),
                  Expanded(child: Text(t, style: const TextStyle(color: Colors.white))),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _intentionStep() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle('Qu\'est-ce qui vous amene ?', 'Cela nous aide a hierarchiser votre flux.'),
        ...intentions.map((item) {
          final selected = _intention == item.$1;
          return Card(
            color: selected ? AppTheme.accent500.withValues(alpha: 0.15) : AppTheme.ink700,
            child: ListTile(
              leading: Icon(item.$3, color: Colors.white),
              title: Text(item.$2, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              trailing: selected ? const Icon(Icons.check, color: AppTheme.accent400) : null,
              onTap: () => setState(() => _intention = item.$1),
            ),
          );
        }),
      ],
    );
  }

  Widget _domainsStep() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle(
          'Quels univers vous interessent ?',
          'Selectionnez au moins 3 univers (${_domains.length} selectionne${_domains.length > 1 ? 's' : ''}).',
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 0.85,
          ),
          itemCount: domainCategories.length,
          itemBuilder: (context, index) {
            final domain = domainCategories[index];
            final selected = _domains.contains(domain.id);
            return InkWell(
              onTap: () {
                setState(() {
                  if (selected) {
                    _domains.remove(domain.id);
                    _subcategories.removeWhere(domain.subcategories.contains);
                  } else {
                    _domains.add(domain.id);
                  }
                });
              },
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: selected ? AppTheme.accent400 : AppTheme.ink700),
                  borderRadius: BorderRadius.circular(16),
                  color: selected ? AppTheme.accent500.withValues(alpha: 0.15) : null,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(domain.icon, color: Colors.white, size: 28),
                    const SizedBox(height: 8),
                    Text(
                      domain.name,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _subcategoriesStep() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle('Affinez vos rayons', 'Facultatif - sans selection, tout l\'univers est affiche.'),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _availableSubcategories.map((sub) {
            final selected = _subcategories.contains(sub);
            return FilterChip(
              label: Text(sub),
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
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _budgetStep() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle('Quel budget par article ?', 'Les articles au-dela seront retrogrades, jamais masques.'),
        ...budgets.map((b) {
          final selected = _budget == b.$1;
          return Card(
            color: selected ? AppTheme.accent500.withValues(alpha: 0.15) : AppTheme.ink700,
            child: ListTile(
              title: Text(b.$2, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
              trailing: selected ? const Icon(Icons.check, color: AppTheme.accent400) : null,
              onTap: () => setState(() => _budget = b.$1),
            ),
          );
        }),
      ],
    );
  }

  Widget _locationStep() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle('Ou cherchez-vous ?', 'Les boutiques proches remontent en priorite.'),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                DropdownButtonFormField<String>(
                  value: _city,
                  decoration: const InputDecoration(labelText: 'Ville'),
                  items: ['Abidjan', 'Bouake', 'Yamoussoukro']
                      .map((v) => DropdownMenuItem(value: v, child: Text(v)))
                      .toList(),
                  onChanged: (v) => setState(() => _city = v ?? _city),
                ),
                const SizedBox(height: 16),
                Text('Rayon de recherche : ${_radiusKm.round()} km'),
                Slider(
                  value: _radiusKm,
                  min: 2,
                  max: 60,
                  divisions: 58,
                  onChanged: (v) => setState(() => _radiusKm = v),
                ),
                DropdownButtonFormField<String>(
                  value: _preferredMode,
                  decoration: const InputDecoration(labelText: 'Mode de recuperation'),
                  items: const [
                    DropdownMenuItem(value: 'peu-importe', child: Text('Peu importe')),
                    DropdownMenuItem(value: 'retrait', child: Text('Retrait en boutique')),
                    DropdownMenuItem(value: 'livraison', child: Text('Livraison')),
                  ],
                  onChanged: (v) => setState(() => _preferredMode = v ?? _preferredMode),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _finalStep() {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle('Deux derniers reglages', 'Vous pourrez les changer quand vous voulez.'),
        Card(
          child: Column(
            children: [
              SwitchListTile(
                title: const Text('Mettre les promotions en avant'),
                subtitle: const Text('Les articles en reduction apparaissent d\'abord'),
                value: _promosOnly,
                onChanged: (v) => setState(() => _promosOnly = v),
              ),
              const Divider(height: 1),
              SwitchListTile(
                title: const Text('Privilegier les boutiques de ma ville'),
                value: _localOnly,
                onChanged: (v) => setState(() => _localOnly = v),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Card(
          color: AppTheme.ink700,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('VOTRE PROFIL', style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(
                  '${_domains.length} univers - ${_subcategories.length} rayon(s)',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                Text(
                  '$_city - ${_radiusKm.round()} km - $_preferredMode',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _stepTitle(String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }
}

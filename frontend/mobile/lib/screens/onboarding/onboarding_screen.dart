import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../data/demo/demo_accounts.dart';
import '../../data/models/preferences.dart';
import '../../providers/auth_provider.dart';
import '../../providers/preferences_provider.dart';
import '../../widgets/app_layout.dart';

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
    'Derniers réglages',
  ];

  int _step = 0;
  String _intention = 'quotidien';
  final Set<String> _domains = {};
  final Set<String> _subcategories = {};
  String _budget = 'illimite';
  String _city = onboardingCities.first;
  double _radiusKm = 15;
  String _preferredMode = 'peu-importe';
  bool _promosOnly = false;
  bool _localOnly = true;
  String _themeMode = 'systeme';

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
      domains: skip && _domains.isEmpty ? suggestedDomains() : _domains.toList(),
      subcategories: skip ? [] : _subcategories.toList(),
      budget: _budget,
      city: _city,
      radiusKm: _radiusKm.round(),
      preferredMode: _preferredMode,
      promosOnly: _promosOnly,
      localOnly: _localOnly,
      themeMode: _themeMode,
    );
    await context.read<PreferencesProvider>().completeOnboarding(prefs);
    if (mounted) context.go('/client');
  }

  String _preferredModeLabel() {
    return switch (_preferredMode) {
      'retrait' => 'retrait',
      'livraison' => 'livraison',
      _ => 'retrait ou livraison',
    };
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: AppTheme.ink900,
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'ÉTAPE ${_step + 1}/7 · ${_titles[_step].toUpperCase()}',
                        style: const TextStyle(
                          color: AppTheme.accent300,
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                        ),
                      ),
                      TextButton(
                        onPressed: () => _finish(skip: true),
                        child: const Text('Passer', style: TextStyle(color: AppTheme.ink300, fontWeight: FontWeight.w700)),
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
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: _buildStep(auth),
              ),
            ),
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: AppTheme.ink800)),
                color: AppTheme.ink900,
              ),
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  if (_step > 0)
                    OutlinedButton(
                      onPressed: () => setState(() => _step--),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: AppTheme.ink700),
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      ),
                      child: const Text('Retour'),
                    ),
                  if (_step > 0) const SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: _canContinue
                          ? () {
                              if (_step == 6) {
                                _finish();
                              } else {
                                setState(() => _step++);
                              }
                            }
                          : null,
                      icon: Icon(_step == 6 ? Icons.check : Icons.arrow_forward, size: 18),
                      label: Text(
                        _step == 0
                            ? 'Commencer'
                            : _step == 6
                                ? 'Voir mon flux'
                                : 'Continuer',
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: AppTheme.ink900,
                        disabledBackgroundColor: AppTheme.ink700,
                        disabledForegroundColor: AppTheme.ink400,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
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

  Widget _buildStep(AuthProvider auth) {
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
        return _finalStep(auth);
    }
  }

  Widget _welcomeStep() {
    return SingleChildScrollView(
      key: const ValueKey('welcome'),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppTheme.accent500,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.auto_awesome_outlined, color: Colors.white, size: 28),
          ),
          const SizedBox(height: 20),
          const Text(
            'Des milliers d\'articles.\nUn flux fait pour vous.',
            style: TextStyle(color: Colors.white, fontSize: 27, fontWeight: FontWeight.w800, height: 1.15),
          ),
          const SizedBox(height: 12),
          const Text(
            'Agroalimentaire, véhicules, matériaux techniques, technologie, bijoux, animaux, style… Le catalogue couvre 18 univers et plus de 100 rayons. Répondez à 6 questions rapides : nous n\'afficherons que ce qui vous concerne, et vous pourrez tout modifier plus tard.',
            style: TextStyle(color: AppTheme.ink300, height: 1.5, fontSize: 14),
          ),
          const SizedBox(height: 24),
          ...[
            'Choisissez vos univers de vente',
            'Affinez par rayon précis',
            'Fixez votre budget et votre zone',
          ].map(
            (t) => Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                children: [
                  const Icon(Icons.check, color: AppTheme.accent400, size: 16),
                  const SizedBox(width: 8),
                  Expanded(child: Text(t, style: const TextStyle(color: AppTheme.ink200, fontSize: 13))),
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
      key: const ValueKey('intention'),
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle('Qu\'est-ce qui vous amène ?', 'Cela nous aide à hiérarchiser votre flux.'),
        ...intentions.map((item) {
          final selected = _intention == item.$1;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: selected ? AppTheme.accent500.withValues(alpha: 0.15) : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                onTap: () => setState(() => _intention = item.$1),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: selected ? AppTheme.accent400 : AppTheme.ink700),
                  ),
                  child: Row(
                    children: [
                      Icon(item.$3, size: 22, color: Colors.white),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(item.$2, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
                      ),
                      if (selected) const Icon(Icons.check, color: AppTheme.accent400, size: 18),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _domainsStep() {
    return ListView(
      key: const ValueKey('domains'),
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle(
          'Quels univers vous intéressent ?',
          'Sélectionnez au moins 3 univers (${_domains.length} sélectionné${_domains.length > 1 ? 's' : ''}).',
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
            childAspectRatio: 0.9,
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
              borderRadius: BorderRadius.circular(16),
              child: Container(
                decoration: BoxDecoration(
                  border: Border.all(color: selected ? AppTheme.accent400 : AppTheme.ink700),
                  borderRadius: BorderRadius.circular(16),
                  color: selected ? AppTheme.accent500.withValues(alpha: 0.15) : null,
                ),
                child: Stack(
                  children: [
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(domain.icon, size: 24, color: selected ? AppTheme.accent300 : AppTheme.ink200),
                          const SizedBox(height: 6),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 4),
                            child: Text(
                              domain.name,
                              textAlign: TextAlign.center,
                              style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (selected)
                      Positioned(
                        top: 6,
                        right: 6,
                        child: Container(
                          width: 16,
                          height: 16,
                          decoration: const BoxDecoration(color: AppTheme.accent500, shape: BoxShape.circle),
                          child: const Icon(Icons.check, size: 10, color: Colors.white),
                        ),
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
      key: const ValueKey('subcategories'),
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle('Affinez vos rayons', 'Facultatif — sans sélection, tout l\'univers est affiché.'),
        if (_availableSubcategories.isEmpty)
          const Text('Revenez à l\'étape précédente pour choisir des univers.', style: TextStyle(color: AppTheme.ink400, fontSize: 13))
        else
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _availableSubcategories.map((sub) {
              final selected = _subcategories.contains(sub);
              final domainId = domainCategories.firstWhere((d) => d.subcategories.contains(sub)).id;
              return FilterChip(
                avatar: Icon(domainIcon(domainId), size: 16, color: selected ? Colors.white : AppTheme.ink400),
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
                backgroundColor: AppTheme.ink800,
                selectedColor: AppTheme.accent500.withValues(alpha: 0.2),
                labelStyle: TextStyle(
                  color: selected ? Colors.white : AppTheme.ink300,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
                side: BorderSide(color: selected ? AppTheme.accent400 : AppTheme.ink700),
                showCheckmark: false,
              );
            }).toList(),
          ),
      ],
    );
  }

  Widget _budgetStep() {
    return ListView(
      key: const ValueKey('budget'),
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle('Quel budget par article ?', 'Les articles au-delà seront rétrogradés, jamais masqués.'),
        ...budgets.map((b) {
          final selected = _budget == b.$1;
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Material(
              color: selected ? AppTheme.accent500.withValues(alpha: 0.15) : Colors.transparent,
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                onTap: () => setState(() => _budget = b.$1),
                borderRadius: BorderRadius.circular(16),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: selected ? AppTheme.accent400 : AppTheme.ink700),
                  ),
                  child: Row(
                    children: [
                      Expanded(child: Text(b.$2, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700))),
                      if (selected) const Icon(Icons.check, color: AppTheme.accent400, size: 18),
                    ],
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _locationStep() {
    return ListView(
      key: const ValueKey('location'),
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle('Où cherchez-vous ?', 'Les boutiques proches de vous remontent en priorité.'),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DropdownButtonFormField<String>(
                value: _city,
                decoration: const InputDecoration(labelText: 'Ville *'),
                items: onboardingCities.map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
                onChanged: (v) => setState(() => _city = v ?? _city),
              ),
              const SizedBox(height: 16),
              Text('Rayon de recherche : ${_radiusKm.round()} km', style: const TextStyle(fontWeight: FontWeight.w600)),
              Slider(
                value: _radiusKm,
                min: 2,
                max: 60,
                divisions: 58,
                activeColor: AppTheme.accent500,
                onChanged: (v) => setState(() => _radiusKm = v),
              ),
              DropdownButtonFormField<String>(
                value: _preferredMode,
                decoration: const InputDecoration(labelText: 'Mode de récupération préféré'),
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
        const SizedBox(height: 12),
        const Row(
          children: [
            Icon(Icons.location_on_outlined, size: 14, color: AppTheme.ink400),
            SizedBox(width: 6),
            Expanded(
              child: Text(
                'Modifiable à tout moment depuis les paramètres.',
                style: TextStyle(color: AppTheme.ink400, fontSize: 12),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _finalStep(AuthProvider auth) {
    return ListView(
      key: const ValueKey('final'),
      padding: const EdgeInsets.all(20),
      children: [
        _stepTitle('Deux derniers réglages', 'Vous pourrez les changer quand vous voulez.'),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
          child: Column(
            children: [
              SwitchListTile(
                title: const Text('Mettre les promotions en avant'),
                subtitle: const Text('Les articles en réduction apparaissent d\'abord'),
                value: _promosOnly,
                onChanged: (v) => setState(() => _promosOnly = v),
              ),
              const Divider(height: 1),
              SwitchListTile(
                title: const Text('Privilégier les boutiques de ma ville'),
                value: _localOnly,
                onChanged: (v) => setState(() => _localOnly = v),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.all(16),
                child: ThemeSelector(value: _themeMode, onChanged: (v) => setState(() => _themeMode = v)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (auth.isAuthenticated && auth.user != null)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.emerald600.withValues(alpha: 0.4)),
              color: AppTheme.emerald600.withValues(alpha: 0.1),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.white,
                  child: Text(auth.user!.initials, style: const TextStyle(color: AppTheme.ink900, fontWeight: FontWeight.w800, fontSize: 12)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(auth.user!.email, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
                      const Text('Tickets et préférences synchronisés', style: TextStyle(color: AppTheme.emerald400, fontSize: 11)),
                    ],
                  ),
                ),
              ],
            ),
          )
        else
          Material(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            child: InkWell(
              onTap: () async {
                await auth.loginDemoGoogle();
              },
              borderRadius: BorderRadius.circular(16),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(color: AppTheme.sand100, borderRadius: BorderRadius.circular(12)),
                      child: const Icon(Icons.mail_outline, color: AppTheme.ink700),
                    ),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Se connecter avec Google', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                          Text(
                            'Facultatif — sauvegarde des tickets, préférences, favoris et panier',
                            style: TextStyle(color: AppTheme.ink400, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    const Text('Activer', style: TextStyle(color: AppTheme.accent600, fontWeight: FontWeight.w800, fontSize: 11)),
                  ],
                ),
              ),
            ),
          ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.ink700),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('VOTRE PROFIL', style: TextStyle(color: AppTheme.ink400, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
              const SizedBox(height: 8),
              Text(
                '${_domains.isEmpty ? 'Aucun' : _domains.length} univers · ${_subcategories.length} rayon(s) · ${budgetLabel(_budget)}',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
              ),
              Text(
                '$_city · ${_radiusKm.round()} km · ${_preferredModeLabel()}',
                style: const TextStyle(color: AppTheme.ink300, fontSize: 12),
              ),
            ],
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
          Text(subtitle, style: const TextStyle(color: AppTheme.ink300, fontSize: 14)),
        ],
      ),
    );
  }
}

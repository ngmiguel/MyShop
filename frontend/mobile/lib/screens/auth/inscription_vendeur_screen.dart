import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../data/demo/demo_accounts.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/top_bar.dart';

/// Inscription vendeur en 3 étapes — prototype Boutika.
class InscriptionVendeurScreen extends StatefulWidget {
  const InscriptionVendeurScreen({super.key});

  @override
  State<InscriptionVendeurScreen> createState() => _InscriptionVendeurScreenState();
}

class _InscriptionVendeurScreenState extends State<InscriptionVendeurScreen> {
  static const _steps = ['Boutique', 'Identité', 'Compte'];

  int _step = 0;
  String _storeId = demoStores.first.id;
  final _accessCodeController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _idController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _password2Controller = TextEditingController();
  String _job = sellerJobTitles.first;
  final _errors = <String, String>{};
  bool _submitting = false;

  @override
  void dispose() {
    _accessCodeController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _idController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _password2Controller.dispose();
    super.dispose();
  }

  bool _validate() {
    _errors.clear();
    if (_step == 0) {
      final code = storeAccessCode(_storeId);
      if (code == null || code.toUpperCase() != _accessCodeController.text.trim().toUpperCase()) {
        _errors['mdpBoutique'] = 'Mot de passe boutique invalide. Demandez-le à votre manageur.';
      }
    }
    if (_step == 1) {
      if (_firstNameController.text.trim().length < 2) _errors['prenom'] = 'Prénom requis.';
      if (_lastNameController.text.trim().length < 2) _errors['nom'] = 'Nom requis.';
      if (!RegExp(r'^[+0-9 ]{8,}$').hasMatch(_phoneController.text.trim())) {
        _errors['telephone'] = 'Numéro invalide.';
      }
      if (_idController.text.trim().length < 5) {
        _errors['cni'] = "Numéro de pièce d'identité requis.";
      }
    }
    if (_step == 2) {
      final email = _emailController.text.trim();
      if (!RegExp(r'^\S+@\S+\.\S+$').hasMatch(email)) {
        _errors['email'] = 'E-mail invalide.';
      } else if (emailAlreadyUsed(email)) {
        _errors['email'] = 'Un compte utilise déjà cet e-mail.';
      }
      if (_passwordController.text.length < 6) _errors['mdp'] = '6 caractères minimum.';
      if (_passwordController.text != _password2Controller.text) {
        _errors['mdp2'] = 'Les mots de passe ne correspondent pas.';
      }
    }
    setState(() {});
    return _errors.isEmpty;
  }

  Future<void> _next() async {
    if (!_validate()) return;
    if (_step < 2) {
      setState(() => _step++);
      return;
    }

    setState(() => _submitting = true);
    final result = await context.read<AuthProvider>().registerDemoSeller(
          storeId: _storeId,
          accessCode: _accessCodeController.text.trim(),
          firstName: _firstNameController.text.trim(),
          lastName: _lastNameController.text.trim(),
          phone: _phoneController.text.trim(),
          email: _emailController.text.trim(),
          password: _passwordController.text,
          jobTitle: _job,
        );
    if (!mounted) return;
    setState(() => _submitting = false);

    if (result == 'pending') {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Inscription envoyée : le manageur doit valider votre compte.')),
      );
      context.go('/auth/vendeur');
      return;
    }
    if (result != null) {
      setState(() => _errors['form'] = result);
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Compte créé, bienvenue !')),
    );
    context.go('/vendeur');
  }

  @override
  Widget build(BuildContext context) {
    final hintCode = storeAccessCode(_storeId);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: TopBar(
        title: 'Inscription vendeur',
        subtitle: 'Étape ${_step + 1} sur 3 · ${_steps[_step]}',
        onBack: () {
          if (_step > 0) {
            setState(() => _step--);
          } else {
            context.go('/auth/vendeur');
          }
        },
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Row(
              children: List.generate(_steps.length, (i) {
                return Expanded(
                  child: Padding(
                    padding: EdgeInsets.only(right: i < _steps.length - 1 ? 6 : 0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Container(
                          height: 6,
                          decoration: BoxDecoration(
                            color: i <= _step ? AppTheme.accent500 : AppTheme.ink200,
                            borderRadius: BorderRadius.circular(999),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _steps[i],
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: i <= _step ? AppTheme.ink800 : AppTheme.ink300,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                if (_step == 0) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(color: AppTheme.sand100, borderRadius: BorderRadius.circular(16)),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.key_outlined, size: 17, color: AppTheme.accent600),
                        SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Chaque boutique possède un mot de passe d’affiliation fourni par son manageur. Il garantit que seuls les employés réels rejoignent l’équipe.',
                            style: TextStyle(fontSize: 12, height: 1.5, color: AppTheme.ink600),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _storeId,
                    decoration: const InputDecoration(labelText: 'Boutique d’affectation *'),
                    items: demoStores
                        .map((s) => DropdownMenuItem(value: s.id, child: Text('${s.name} — ${s.city}', overflow: TextOverflow.ellipsis)))
                        .toList(),
                    onChanged: (v) => setState(() => _storeId = v ?? _storeId),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _accessCodeController,
                    textCapitalization: TextCapitalization.characters,
                    decoration: InputDecoration(
                      labelText: 'Mot de passe boutique *',
                      hintText: hintCode,
                      helperText: 'Démo : $hintCode',
                      errorText: _errors['mdpBoutique'],
                    ),
                  ),
                ] else if (_step == 1) ...[
                  TextField(
                    controller: _firstNameController,
                    decoration: InputDecoration(labelText: 'Prénom *', errorText: _errors['prenom']),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _lastNameController,
                    decoration: InputDecoration(labelText: 'Nom *', errorText: _errors['nom']),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[+0-9 ]'))],
                    decoration: InputDecoration(
                      labelText: 'Téléphone *',
                      hintText: '+237 6 00 00 00 00',
                      errorText: _errors['telephone'],
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _idController,
                    decoration: InputDecoration(
                      labelText: 'Pièce d’identité *',
                      errorText: _errors['cni'],
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: _job,
                    decoration: const InputDecoration(labelText: 'Poste'),
                    items: sellerJobTitles.map((j) => DropdownMenuItem(value: j, child: Text(j))).toList(),
                    onChanged: (v) => setState(() => _job = v ?? _job),
                  ),
                ] else ...[
                  TextField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(
                      labelText: 'E-mail professionnel *',
                      errorText: _errors['email'] ?? _errors['form'],
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _passwordController,
                    obscureText: true,
                    decoration: InputDecoration(labelText: 'Mot de passe *', errorText: _errors['mdp']),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _password2Controller,
                    obscureText: true,
                    decoration: InputDecoration(labelText: 'Confirmer le mot de passe *', errorText: _errors['mdp2']),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppTheme.sand100, borderRadius: BorderRadius.circular(12)),
                    child: const Text(
                      'Votre compte sera actif après validation du manageur de la boutique.',
                      style: TextStyle(fontSize: 12, color: AppTheme.ink600, height: 1.4),
                    ),
                  ),
                ],
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: SafeArea(
              top: false,
              child: FilledButton(
                onPressed: _submitting ? null : _next,
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.ink900,
                  minimumSize: const Size.fromHeight(48),
                ),
                child: _submitting
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(
                        _step == 2 ? 'Créer mon compte' : 'Continuer',
                        style: const TextStyle(fontWeight: FontWeight.w800),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

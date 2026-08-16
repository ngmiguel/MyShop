import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../data/demo/demo_accounts.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/top_bar.dart';

/// Connexion manageur — alignée sur le prototype Boutika.
class ConnexionManagerScreen extends StatefulWidget {
  const ConnexionManagerScreen({super.key});

  @override
  State<ConnexionManagerScreen> createState() => _ConnexionManagerScreenState();
}

class _ConnexionManagerScreenState extends State<ConnexionManagerScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _visible = false;
  String? _localError;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _localError = null);
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(
      _emailController.text.trim(),
      _passwordController.text,
      expectedRole: 'manager',
    );
    if (!mounted) return;
    if (!ok) {
      setState(() => _localError = auth.error ?? 'Identifiants administrateur incorrects.');
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Bienvenue dans votre espace de pilotage.')),
    );
    context.go('/manager');
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final error = _localError ?? auth.error;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: TopBar(
        title: 'Espace manageur',
        subtitle: 'Accès administrateur',
        onBack: () => context.go('/auth'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.ink900,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.verified_user_outlined, color: AppTheme.accent300, size: 18),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text.rich(
                      TextSpan(
                        style: const TextStyle(color: AppTheme.ink200, fontSize: 12, height: 1.5),
                        children: [
                          const TextSpan(text: 'Compte de démonstration : '),
                          TextSpan(
                            text: demoManagerEmail,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                          ),
                          const TextSpan(text: ' · mot de passe '),
                          TextSpan(
                            text: demoManagerPassword,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'E-mail professionnel *',
                hintText: demoManagerEmail,
                errorText: error,
              ),
              onChanged: (_) => setState(() => _localError = null),
              validator: (v) => v != null && v.contains('@') ? null : 'Email invalide',
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _passwordController,
              obscureText: !_visible,
              decoration: InputDecoration(
                labelText: 'Mot de passe *',
                hintText: '••••••••',
                suffixIcon: IconButton(
                  icon: Icon(_visible ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  onPressed: () => setState(() => _visible = !_visible),
                ),
              ),
              validator: (v) => v != null && v.isNotEmpty ? null : 'Mot de passe requis',
            ),
            Align(
              alignment: Alignment.centerLeft,
              child: TextButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Un lien de réinitialisation a été envoyé.')),
                  );
                },
                child: const Text('Mot de passe oublié ?', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.accent600, fontSize: 12)),
              ),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: auth.loading ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.accent500,
                minimumSize: const Size.fromHeight(48),
              ),
              child: auth.loading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Se connecter', style: TextStyle(fontWeight: FontWeight.w800)),
            ),
            const SizedBox(height: 16),
            const Text(
              'L’accès manageur est journalisé. Toute création de boutique et validation de vendeur est tracée dans le monitoring.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.ink400, fontSize: 11, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../data/demo/demo_accounts.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/top_bar.dart';

/// Connexion vendeur — alignée sur le prototype Boutika.
class ConnexionVendeurScreen extends StatefulWidget {
  const ConnexionVendeurScreen({super.key});

  @override
  State<ConnexionVendeurScreen> createState() => _ConnexionVendeurScreenState();
}

class _ConnexionVendeurScreenState extends State<ConnexionVendeurScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _visible = false;
  String _storeId = demoStores.first.id;
  String? _localError;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  DemoSellerAccount? get _demoSeller {
    try {
      return demoSellers.firstWhere((s) => s.storeId == _storeId && s.isActive);
    } catch (_) {
      return null;
    }
  }

  void _fillDemo() {
    final seller = _demoSeller;
    if (seller == null) return;
    setState(() {
      _emailController.text = seller.email;
      _passwordController.text = seller.password;
      _localError = null;
    });
  }

  Future<void> _copy(String label, String value) async {
    await Clipboard.setData(ClipboardData(text: value));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$label copié'), duration: const Duration(seconds: 1)),
    );
  }

  Future<void> _submit() async {
    setState(() => _localError = null);
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.loginDemoSeller(
      storeId: _storeId,
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );
    if (!mounted) return;
    if (!ok) {
      setState(() => _localError = auth.error);
      return;
    }
    final name = auth.user?.firstName ?? 'Vendeur';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Bonjour $name, bonne vente !')),
    );
    context.go('/vendeur');
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final error = _localError ?? auth.error;
    final demo = _demoSeller;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: TopBar(
        title: 'Espace vendeur',
        subtitle: 'Connexion',
        onBack: () => context.go('/auth'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (demo != null) ...[
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.ink900,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.badge_outlined, color: AppTheme.accent300, size: 18),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'Compte de démonstration',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                          ),
                        ),
                        TextButton(
                          onPressed: _fillDemo,
                          style: TextButton.styleFrom(
                            foregroundColor: AppTheme.accent300,
                            padding: const EdgeInsets.symmetric(horizontal: 8),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text('Remplir', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 12)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    _DemoCredentialRow(
                      label: 'E-mail',
                      value: demo.email,
                      onCopy: () => _copy('E-mail', demo.email),
                    ),
                    const SizedBox(height: 6),
                    _DemoCredentialRow(
                      label: 'Mot de passe',
                      value: demo.password,
                      onCopy: () => _copy('Mot de passe', demo.password),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            DropdownButtonFormField<String>(
              initialValue: _storeId,
              decoration: const InputDecoration(labelText: 'Votre boutique *'),
              items: demoStores
                  .map((s) => DropdownMenuItem(value: s.id, child: Text('${s.name} — ${s.city}', overflow: TextOverflow.ellipsis)))
                  .toList(),
              onChanged: (v) {
                if (v == null) return;
                setState(() {
                  _storeId = v;
                  _localError = null;
                });
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'E-mail professionnel *',
                hintText: demo?.email ?? 'prenom@boutique.cm',
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
                hintText: demo?.password ?? '••••••••',
                suffixIcon: IconButton(
                  icon: Icon(_visible ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  onPressed: () => setState(() => _visible = !_visible),
                ),
              ),
              validator: (v) => v != null && v.length >= 4 ? null : 'Mot de passe trop court',
            ),
            const SizedBox(height: 24),
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
            Text.rich(
              TextSpan(
                style: const TextStyle(fontSize: 13, color: AppTheme.ink500),
                children: [
                  const TextSpan(text: 'Nouveau dans une boutique ? '),
                  WidgetSpan(
                    alignment: PlaceholderAlignment.baseline,
                    baseline: TextBaseline.alphabetic,
                    child: GestureDetector(
                      onTap: () => context.go('/auth/inscription-vendeur'),
                      child: const Text(
                        'Créer un compte vendeur',
                        style: TextStyle(fontWeight: FontWeight.w800, color: AppTheme.accent600, fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _DemoCredentialRow extends StatelessWidget {
  const _DemoCredentialRow({
    required this.label,
    required this.value,
    required this.onCopy,
  });

  final String label;
  final String value;
  final VoidCallback onCopy;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 88,
          child: Text(label, style: const TextStyle(color: AppTheme.ink300, fontSize: 11)),
        ),
        Expanded(
          child: SelectableText(
            value,
            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700),
          ),
        ),
        IconButton(
          tooltip: 'Copier',
          onPressed: onCopy,
          visualDensity: VisualDensity.compact,
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
          icon: const Icon(Icons.copy, size: 16, color: AppTheme.accent300),
        ),
      ],
    );
  }
}

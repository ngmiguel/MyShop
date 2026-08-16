import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../data/demo/demo_accounts.dart';
import '../../providers/auth_provider.dart';

/// Logo Google « G » multicolore (prototype Boutika).
class GoogleLogo extends StatelessWidget {
  const GoogleLogo({super.key, this.size = 18});

  final double size;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(painter: _GoogleGPainter()),
    );
  }
}

class _GoogleGPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final r = size.width / 2;
    final center = Offset(r, r);
    final stroke = size.width * 0.18;

    void arc(Color color, double start, double sweep) {
      final paint = Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.butt;
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: r - stroke / 2),
        start,
        sweep,
        false,
        paint,
      );
    }

    arc(const Color(0xFF4285F4), -0.55, 1.55);
    arc(const Color(0xFF34A853), 1.0, 1.15);
    arc(const Color(0xFFFBBC05), 2.15, 1.0);
    arc(const Color(0xFFEA4335), 3.15, 1.05);

    canvas.drawRect(
      Rect.fromLTWH(r - stroke * 0.1, r - stroke / 2, r * 0.95, stroke),
      Paint()..color = const Color(0xFF4285F4),
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Feuille Google en 2 étapes — overlay plein écran comme le prototype.
class GoogleSignInSheet extends StatefulWidget {
  const GoogleSignInSheet({super.key, this.onConnected});

  final VoidCallback? onConnected;

  static Future<void> show(BuildContext context, {VoidCallback? onConnected}) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      barrierColor: const Color(0xFF0B1220).withValues(alpha: 0.6),
      builder: (sheetContext) => GoogleSignInSheet(onConnected: onConnected),
    );
  }

  @override
  State<GoogleSignInSheet> createState() => _GoogleSignInSheetState();
}

class _GoogleSignInSheetState extends State<GoogleSignInSheet> {
  bool _authStep = false;
  DemoGoogleAccount? _chosen;
  final _emailController = TextEditingController();
  final _nameController = TextEditingController();
  String? _error;

  @override
  void dispose() {
    _emailController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  void _close() {
    Navigator.of(context, rootNavigator: true).pop();
  }

  void _pick(DemoGoogleAccount account) {
    setState(() {
      _chosen = account;
      _authStep = true;
      _error = null;
    });
  }

  void _pickOther() {
    final email = _emailController.text.trim().toLowerCase();
    if (!RegExp(r'^\S+@\S+\.\S+$').hasMatch(email)) {
      setState(() => _error = 'Adresse Gmail invalide.');
      return;
    }
    final nom = _nameController.text.trim();
    final display = nom.isNotEmpty ? nom : email.split('@').first;
    final parts = display.split(RegExp(r'\s+')).where((p) => p.isNotEmpty).take(2);
    final initiales = parts.isEmpty ? '?' : parts.map((p) => p[0].toUpperCase()).join();
    _pick(DemoGoogleAccount(email: email, nom: display, initiales: initiales));
  }

  Future<void> _authorize() async {
    if (_chosen == null) return;
    final parts = _chosen!.nom.split(' ');
    final auth = context.read<AuthProvider>();
    final ok = await auth.loginDemoGoogle(
      email: _chosen!.email,
      firstName: parts.isNotEmpty ? parts.first : 'Client',
      lastName: parts.length > 1 ? parts.skip(1).join(' ') : 'Boutika',
    );
    if (!mounted) return;
    if (ok) {
      final messenger = ScaffoldMessenger.maybeOf(context);
      _close();
      messenger?.showSnackBar(
        const SnackBar(content: Text('Compte Google connecté et synchronisé')),
      );
      widget.onConnected?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final viewInsets = MediaQuery.viewInsetsOf(context).bottom;
    final maxH = MediaQuery.sizeOf(context).height * 0.88;

    return Padding(
      padding: EdgeInsets.only(bottom: viewInsets),
      child: Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxH, maxWidth: 430),
          child: Material(
            color: Colors.white,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            clipBehavior: Clip.antiAlias,
            child: SafeArea(
              top: false,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 10),
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.ink200,
                      borderRadius: BorderRadius.circular(999),
                    ),
                  ),
                  Flexible(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                      child: _authStep ? _buildAuthStep() : _buildAccountStep(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader({required String title, required String subtitle}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(top: 2),
          child: GoogleLogo(size: 22),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
              Text(subtitle, style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
            ],
          ),
        ),
        IconButton(
          onPressed: _close,
          tooltip: 'Fermer',
          icon: const Icon(Icons.close, color: AppTheme.ink400, size: 20),
        ),
      ],
    );
  }

  Widget _buildAccountStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildHeader(
          title: 'Se connecter avec Google',
          subtitle: 'Sélectionnez un compte Gmail',
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppTheme.ink100),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              for (var i = 0; i < demoGoogleAccounts.length; i++) ...[
                if (i > 0) const Divider(height: 1),
                InkWell(
                  onTap: () => _pick(demoGoogleAccounts[i]),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppTheme.ink900,
                          radius: 20,
                          child: Text(
                            demoGoogleAccounts[i].initiales,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                demoGoogleAccounts[i].nom,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                              ),
                              Text(
                                demoGoogleAccounts[i].email,
                                style: const TextStyle(fontSize: 12, color: AppTheme.ink400),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            border: Border.all(color: AppTheme.ink100),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Utiliser un autre compte', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
              const SizedBox(height: 10),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: 'Adresse Gmail',
                  hintText: 'prenom.nom@gmail.com',
                  errorText: _error,
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _nameController,
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _pickOther(),
                decoration: const InputDecoration(
                  labelText: 'Nom affiché',
                  hintText: 'Awa Koné',
                  helperText: 'Facultatif',
                ),
              ),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _pickOther,
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.accent500,
                  minimumSize: const Size.fromHeight(44),
                ),
                child: const Text('Continuer', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        const Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.lock_outline, size: 13, color: AppTheme.ink400),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'Boutik ne voit jamais votre mot de passe Google. Vous pouvez révoquer l’accès à tout moment depuis les paramètres.',
                style: TextStyle(fontSize: 11, height: 1.45, color: AppTheme.ink400),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildAuthStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildHeader(
          title: 'Autoriser Boutik',
          subtitle: 'Compte : ${_chosen?.email}',
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.sand100,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: AppTheme.ink900,
                child: Text(
                  _chosen!.initiales,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 12),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(_chosen!.nom, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(_chosen!.email, style: const TextStyle(fontSize: 12, color: AppTheme.ink500)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        const Text('Boutik demande l’accès à :', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            border: Border.all(color: AppTheme.ink100),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              for (var i = 0; i < googleScopes.length; i++) ...[
                if (i > 0) const Divider(height: 1),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.check, size: 15, color: AppTheme.emerald600),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(googleScopes[i].title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                            Text(googleScopes[i].detail, style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.ink900,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.verified_user_outlined, size: 13, color: AppTheme.accent300),
                  SizedBox(width: 6),
                  Text(
                    'SERA SYNCHRONISÉ',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppTheme.accent300, letterSpacing: 0.6),
                  ),
                ],
              ),
              SizedBox(height: 6),
              Text(
                'Tickets de caisse, préférences d’affichage, favoris, panier, codes QR, adresses et réglages. Modifiable après connexion.',
                style: TextStyle(fontSize: 12, height: 1.45, color: AppTheme.ink200),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            OutlinedButton(
              onPressed: () => setState(() => _authStep = false),
              style: OutlinedButton.styleFrom(minimumSize: const Size(96, 48)),
              child: const Text('Retour'),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: FilledButton(
                onPressed: _authorize,
                style: FilledButton.styleFrom(
                  backgroundColor: AppTheme.ink900,
                  minimumSize: const Size.fromHeight(48),
                ),
                child: const Text('Autoriser et synchroniser', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

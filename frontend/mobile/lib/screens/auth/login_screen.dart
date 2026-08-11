import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.role});

  final String role;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _accessCodeController = TextEditingController();
  bool _registerMode = false;
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _accessCodeController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    super.dispose();
  }

  String get _roleLabel {
    switch (widget.role) {
      case 'vendeur':
        return 'Vendeur';
      case 'manager':
        return 'Manager';
      default:
        return 'Client';
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = _registerMode
        ? await auth.register(
            email: _emailController.text.trim(),
            password: _passwordController.text,
            role: widget.role,
            firstName: _firstNameController.text.trim().isEmpty
                ? null
                : _firstNameController.text.trim(),
            lastName: _lastNameController.text.trim().isEmpty
                ? null
                : _lastNameController.text.trim(),
            accessCode: widget.role == 'vendeur' ? _accessCodeController.text.trim() : null,
          )
        : await auth.login(
            _emailController.text.trim(),
            _passwordController.text,
            expectedRole: widget.role,
          );

    if (!mounted || !ok) return;
    switch (widget.role) {
      case 'vendeur':
        context.go('/vendeur');
      case 'manager':
        context.go('/manager');
      default:
        context.go('/client');
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text('Connexion $_roleLabel'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/auth'),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (auth.error != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Text(auth.error!, style: const TextStyle(color: Colors.red)),
                ),
              if (_registerMode) ...[
                TextFormField(
                  controller: _firstNameController,
                  decoration: const InputDecoration(labelText: 'Prenom'),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _lastNameController,
                  decoration: const InputDecoration(labelText: 'Nom'),
                ),
                const SizedBox(height: 12),
              ],
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (v) => v != null && v.contains('@') ? null : 'Email invalide',
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: const InputDecoration(labelText: 'Mot de passe'),
                validator: (v) => v != null && v.length >= 6 ? null : 'Minimum 6 caracteres',
              ),
              if (_registerMode && widget.role == 'vendeur') ...[
                const SizedBox(height: 12),
                TextFormField(
                  controller: _accessCodeController,
                  decoration: const InputDecoration(labelText: 'Code d\'acces boutique'),
                  validator: (v) => v != null && v.isNotEmpty ? null : 'Code requis',
                ),
              ],
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: auth.loading ? null : _submit,
                child: auth.loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : Text(_registerMode ? 'Creer un compte' : 'Se connecter'),
              ),
              TextButton(
                onPressed: () => setState(() => _registerMode = !_registerMode),
                child: Text(_registerMode
                    ? 'Deja un compte ? Se connecter'
                    : 'Pas de compte ? S\'inscrire'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

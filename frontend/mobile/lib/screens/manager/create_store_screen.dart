import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/preferences.dart';
import '../../providers/catalog_provider.dart';
import '../../data/services/store_service.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/top_bar.dart';

class CreateStoreScreen extends StatefulWidget {
  const CreateStoreScreen({super.key});

  @override
  State<CreateStoreScreen> createState() => _CreateStoreScreenState();
}

class _CreateStoreScreenState extends State<CreateStoreScreen> {
  static const _steps = ['Identite', 'Categories', 'Lieu', 'Commerce', 'Resume'];
  int _step = 0;
  final _nameController = TextEditingController();
  final _taglineController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  String _city = 'Abidjan';
  final Set<String> _categories = {};
  String _mainCategory = 'agro';
  bool _delivery = false;
  bool _pickup = true;
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _taglineController.dispose();
    _descriptionController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final store = await context.read<StoreService>().createStore({
        'name': _nameController.text.trim(),
        'tagline': _taglineController.text.trim(),
        'description': _descriptionController.text.trim(),
        'address': _addressController.text.trim(),
        'city': _city,
        'mainCategory': _mainCategory,
        'categories': _categories.toList(),
        'delivery': _delivery,
        'pickup': _pickup,
        'status': 'active',
        'paymentMethods': ['mobile_money', 'cash'],
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Boutique "${store.name}" creee')),
        );
        context.go('/manager/boutiques/${store.id}');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur: $e')));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Nouvelle boutique',
        subtitle: 'Etape ${_step + 1}/${_steps.length} - ${_steps[_step]}',
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: List.generate(
              _steps.length,
              (i) => Expanded(
                child: Container(
                  height: 4,
                  margin: EdgeInsets.only(right: i < _steps.length - 1 ? 4 : 0),
                  decoration: BoxDecoration(
                    color: i <= _step ? AppTheme.accent500 : AppTheme.ink100,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          if (_step == 0) ...[
            TextField(controller: _nameController, decoration: const InputDecoration(labelText: 'Nom de la boutique *')),
            const SizedBox(height: 12),
            TextField(controller: _taglineController, decoration: const InputDecoration(labelText: 'Slogan')),
            const SizedBox(height: 12),
            TextField(controller: _descriptionController, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
          ] else if (_step == 1) ...[
            const Text('Selectionnez les categories (max 7)', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: domainCategories.map((d) {
                final selected = _categories.contains(d.id);
                return FilterChip(
                  avatar: Icon(d.icon, size: 16),
                  label: Text(d.name),
                  selected: selected,
                  onSelected: (_) {
                    setState(() {
                      if (selected) {
                        _categories.remove(d.id);
                      } else if (_categories.length < 7) {
                        _categories.add(d.id);
                        _mainCategory = _categories.first;
                      }
                    });
                  },
                );
              }).toList(),
            ),
          ] else if (_step == 2) ...[
            TextField(controller: _addressController, decoration: const InputDecoration(labelText: 'Adresse')),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _city,
              decoration: const InputDecoration(labelText: 'Ville *'),
              items: ['Abidjan', 'Bouake', 'Yamoussoukro'].map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
              onChanged: (v) => setState(() => _city = v ?? _city),
            ),
          ] else if (_step == 3) ...[
            SwitchListTile(title: const Text('Retrait en boutique'), value: _pickup, onChanged: (v) => setState(() => _pickup = v)),
            SwitchListTile(title: const Text('Livraison'), value: _delivery, onChanged: (v) => setState(() => _delivery = v)),
          ] else ...[
            Container(
              decoration: AppTheme.cardDecoration(context),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_nameController.text, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                  if (_taglineController.text.isNotEmpty) Text(_taglineController.text),
                  Text('$_city - ${_categories.length} categorie(s)'),
                  Text('Retrait: ${_pickup ? 'Oui' : 'Non'} - Livraison: ${_delivery ? 'Oui' : 'Non'}'),
                ],
              ),
            ),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              if (_step > 0)
                OutlinedButton(onPressed: _submitting ? null : () => setState(() => _step--), child: const Text('Retour')),
              if (_step > 0) const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  onPressed: _submitting
                      ? null
                      : () {
                          if (_step == 0 && _nameController.text.trim().isEmpty) return;
                          if (_step == 1 && _categories.isEmpty) return;
                          if (_step < _steps.length - 1) {
                            setState(() => _step++);
                          } else {
                            _submit();
                          }
                        },
                  child: _submitting
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_step == _steps.length - 1 ? 'Creer la boutique' : 'Continuer'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ManagerStoreDetailScreen extends StatefulWidget {
  const ManagerStoreDetailScreen({super.key, required this.storeId});

  final String storeId;

  @override
  State<ManagerStoreDetailScreen> createState() => _ManagerStoreDetailScreenState();
}

class _ManagerStoreDetailScreenState extends State<ManagerStoreDetailScreen> {
  String? _accessCode;

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();

    return FutureBuilder(
      future: catalog.getStore(widget.storeId),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Scaffold(body: LoadingView());
        final store = snapshot.data!;
        final products = catalog.productsForStore(store.id);

        return Scaffold(
          appBar: TopBar(title: store.name, subtitle: store.city),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (store.coverUrl != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(store.coverUrl!, height: 160, fit: BoxFit.cover),
                ),
              const SizedBox(height: 16),
              Container(
                decoration: AppTheme.cardDecoration(context),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Code vendeur', style: TextStyle(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    Text(_accessCode ?? '********', style: const TextStyle(fontSize: 20, letterSpacing: 2, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: () async {
                        final code = await context.read<StoreService>().regenerateAccessCode(store.id);
                        setState(() => _accessCode = code);
                      },
                      icon: const Icon(Icons.refresh),
                      label: const Text('Regenerer le code'),
                    ),
                  ],
                ),
              ),
              SectionHeader(title: 'Catalogue (${products.length})'),
              ...products.map(
                (p) => ListTile(
                  title: Text(p.name),
                  subtitle: Text('Stock: ${p.stock}'),
                  trailing: Text(formatPrix(p.displayPrice)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/order.dart';
import '../../providers/cart_provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/orders_provider.dart';
import '../../widgets/top_bar.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  static const _steps = ['Coordonnées', 'Retrait', 'Paiement', 'Résumé'];
  static const _paymentMethods = ['Mobile Money', 'Espèces', 'Carte bancaire', 'Virement'];
  static const _deliveryFeePerStore = 2000.0;
  static const _qrExpirationMin = 30;

  int _step = 0;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _noteController = TextEditingController();
  String _mode = 'pickup';
  String _paymentMethod = 'Mobile Money';
  bool _submitting = false;
  final _errors = <String, String>{};

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _noteController.dispose();
    super.dispose();
  }

  Map<String, double> _storeGroups(CartProvider cart) {
    final map = <String, double>{};
    for (final item in cart.cart.items) {
      map[item.storeId] = (map[item.storeId] ?? 0) + item.lineTotal;
    }
    return map;
  }

  double _deliveryFees(Map<String, double> groups) {
    if (_mode != 'delivery') return 0;
    return groups.length * _deliveryFeePerStore;
  }

  bool _validateStep() {
    _errors.clear();
    if (_step == 0) {
      if (_nameController.text.trim().length < 2) {
        _errors['nom'] = 'Indiquez votre nom complet.';
      }
      if (!RegExp(r'^[+0-9 ]{8,}$').hasMatch(_phoneController.text.trim())) {
        _errors['tel'] = 'Numéro de téléphone invalide.';
      }
    }
    if (_step == 1 && _mode == 'delivery' && _addressController.text.trim().length < 6) {
      _errors['adresse'] = 'Adresse de livraison requise.';
    }
    setState(() {});
    return _errors.isEmpty;
  }

  Future<void> _submit() async {
    if (!_validateStep()) return;
    if (_step < 3) {
      setState(() => _step++);
      return;
    }

    setState(() => _submitting = true);
    try {
      final cartProvider = context.read<CartProvider>();
      final cartItems = List.of(cartProvider.cart.items);
      final ordersProvider = context.read<OrdersProvider>();

      List<OrderModel> orders;
      try {
        orders = await ordersProvider.checkout(
          fulfillmentMode: _mode,
          contactName: _nameController.text.trim(),
          contactPhone: _phoneController.text.trim(),
          paymentMethod: _paymentMethod,
          localItems: cartProvider.localMode ? cartItems : null,
          expirationMinutes: _qrExpirationMin,
          deliveryFeePerStore: _deliveryFeePerStore,
        );
      } catch (_) {
        orders = ordersProvider.generatePaymentCodes(
          items: cartItems,
          fulfillmentMode: _mode,
          contactName: _nameController.text.trim(),
          contactPhone: _phoneController.text.trim(),
          paymentMethod: _paymentMethod,
          expirationMinutes: _qrExpirationMin,
          deliveryFeePerStore: _deliveryFeePerStore,
        );
      }

      await cartProvider.clear();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            orders.length > 1
                ? '${orders.length} codes QR générés — un par boutique.'
                : 'Votre code QR de paiement est prêt.',
          ),
        ),
      );
      if (orders.length == 1) {
        context.go('/client/codes/${orders.first.id}');
      } else {
        context.go('/client/codes');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>().cart;
    final catalog = context.watch<CatalogProvider>();

    if (cart.items.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go('/client/panier');
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final groups = _storeGroups(context.read<CartProvider>());
    final deliveryFees = _deliveryFees(groups);
    final total = cart.subtotal + deliveryFees;

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Paiement',
        subtitle: 'Étape ${_step + 1} sur 4 · ${_steps[_step]}',
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
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
              padding: const EdgeInsets.all(16),
              children: [
                if (_step == 0) ...[
                  _Field(
                    label: 'Nom complet *',
                    error: _errors['nom'],
                    child: TextField(
                      controller: _nameController,
                      decoration: const InputDecoration(hintText: 'Ex. Awa Koné'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  _Field(
                    label: 'Téléphone *',
                    hint: 'Utilisé par le vendeur pour vous identifier',
                    error: _errors['tel'],
                    child: TextField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[+0-9 ]'))],
                      decoration: const InputDecoration(hintText: '+237 6 00 00 00 00'),
                    ),
                  ),
                ] else if (_step == 1) ...[
                  Row(
                    children: [
                      Expanded(
                        child: _ModeCard(
                          title: 'Retrait boutique',
                          subtitle: 'Gratuit · scan sur place',
                          selected: _mode == 'pickup',
                          onTap: () => setState(() => _mode = 'pickup'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _ModeCard(
                          title: 'Livraison',
                          subtitle: 'Frais : ${formatPrix(deliveryFees > 0 ? deliveryFees : _deliveryFeePerStore * groups.length)}',
                          selected: _mode == 'delivery',
                          onTap: () => setState(() => _mode = 'delivery'),
                        ),
                      ),
                    ],
                  ),
                  if (_mode == 'delivery') ...[
                    const SizedBox(height: 12),
                    _Field(
                      label: 'Adresse de livraison *',
                      error: _errors['adresse'],
                      child: TextField(
                        controller: _addressController,
                        maxLines: 3,
                        decoration: const InputDecoration(hintText: 'Quartier, rue, point de repère…'),
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  _Field(
                    label: 'Instructions (facultatif)',
                    child: TextField(
                      controller: _noteController,
                      maxLines: 3,
                      decoration: const InputDecoration(hintText: 'Emballage cadeau, horaire de passage…'),
                    ),
                  ),
                ] else if (_step == 2) ...[
                  _Field(
                    label: 'Moyen de paiement *',
                    child: DropdownButtonFormField<String>(
                      initialValue: _paymentMethod,
                      items: _paymentMethods.map((m) => DropdownMenuItem(value: m, child: Text(m))).toList(),
                      onChanged: (v) => setState(() => _paymentMethod = v ?? _paymentMethod),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: AppTheme.cardDecoration(context),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.verified_user_outlined, size: 18, color: AppTheme.emerald600),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Aucun débit n\'a lieu dans l\'application. Un code QR chiffré est généré ; le vendeur le scanne en boutique pour valider l\'encaissement. Il expire au bout de $_qrExpirationMin minutes.',
                            style: const TextStyle(fontSize: 13, height: 1.5, color: AppTheme.ink600),
                          ),
                        ),
                      ],
                    ),
                  ),
                ] else ...[
                  _RecapCard(
                    title: 'Client',
                    lines: [
                      ('Nom', _nameController.text.trim()),
                      ('Téléphone', _phoneController.text.trim()),
                      ('Mode', _mode == 'pickup' ? 'Retrait en boutique' : 'Livraison'),
                      if (_mode == 'delivery') ('Adresse', _addressController.text.trim()),
                      ('Paiement', _paymentMethod),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _RecapCard(
                    title: '${groups.length} code(s) QR seront générés',
                    lines: [
                      ...groups.entries.map((e) {
                        final store = catalog.storeById(e.key);
                        return (store?.name ?? 'Boutique', formatPrix(e.value));
                      }),
                      ('Total à régler', formatPrix(total)),
                    ],
                    emphasizeLast: true,
                  ),
                ],
              ],
            ),
          ),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppTheme.ink100)),
            ),
            padding: const EdgeInsets.all(12),
            child: SafeArea(
              top: false,
              child: Row(
                children: [
                  OutlinedButton(
                    onPressed: _submitting
                        ? null
                        : () {
                            if (_step == 0) {
                              context.go('/client/panier');
                            } else {
                              setState(() => _step--);
                            }
                          },
                    style: OutlinedButton.styleFrom(minimumSize: const Size(96, 48)),
                    child: const Text('Retour'),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: FilledButton(
                      onPressed: _submitting ? null : _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: AppTheme.ink900,
                        minimumSize: const Size.fromHeight(48),
                      ),
                      child: _submitting
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                if (_step == 3) ...[
                                  const Icon(Icons.check, size: 17),
                                  const SizedBox(width: 6),
                                ],
                                Text(
                                  _step == 3 ? 'Générer le code QR' : 'Continuer',
                                  style: const TextStyle(fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Field extends StatelessWidget {
  const _Field({required this.label, required this.child, this.hint, this.error});

  final String label;
  final Widget child;
  final String? hint;
  final String? error;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
        if (hint != null) Text(hint!, style: const TextStyle(fontSize: 11, color: AppTheme.ink400)),
        const SizedBox(height: 6),
        child,
        if (error != null) ...[
          const SizedBox(height: 4),
          Text(error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
        ],
      ],
    );
  }
}

class _ModeCard extends StatelessWidget {
  const _ModeCard({
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppTheme.ink900 : Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: selected ? AppTheme.ink900 : AppTheme.ink200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 14,
                  color: selected ? Colors.white : AppTheme.ink700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(fontSize: 11, color: selected ? AppTheme.ink200 : AppTheme.ink400),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecapCard extends StatelessWidget {
  const _RecapCard({
    required this.title,
    required this.lines,
    this.emphasizeLast = false,
  });

  final String title;
  final List<(String, String)> lines;
  final bool emphasizeLast;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: AppTheme.cardDecoration(context),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
          const SizedBox(height: 8),
          ...lines.asMap().entries.map((entry) {
            final isLast = emphasizeLast && entry.key == lines.length - 1;
            return Padding(
              padding: EdgeInsets.symmetric(vertical: isLast ? 6 : 2),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      entry.value.$1,
                      style: TextStyle(fontSize: 13, color: isLast ? AppTheme.ink900 : AppTheme.ink400),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    entry.value.$2,
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      fontSize: isLast ? 18 : 13,
                      fontWeight: isLast ? FontWeight.w800 : FontWeight.w600,
                      color: AppTheme.ink800,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

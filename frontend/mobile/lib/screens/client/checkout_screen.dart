import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../core/utils/formatters.dart';
import '../../providers/cart_provider.dart';
import '../../providers/orders_provider.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  static const _steps = ['Coordonnees', 'Retrait', 'Paiement', 'Resume'];
  int _step = 0;
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  String _mode = 'pickup';
  String _paymentMethod = 'Mobile Money';
  bool _submitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_step < 3) {
      setState(() => _step++);
      return;
    }

    setState(() => _submitting = true);
    try {
      final orders = await context.read<OrdersProvider>().checkout(
            fulfillmentMode: _mode,
            contactName: _nameController.text.trim(),
            contactPhone: _phoneController.text.trim(),
            paymentMethod: _paymentMethod,
          );
      await context.read<CartProvider>().loadCart();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            orders.length > 1
                ? '${orders.length} codes QR generes - un par boutique.'
                : 'Votre code QR de paiement est pret.',
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

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Paiement'),
            Text(
              'Etape ${_step + 1} sur 4 - ${_steps[_step]}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
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
                  color: i <= _step ? Theme.of(context).colorScheme.secondary : Colors.grey.shade300,
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          if (_step == 0) ...[
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Nom complet'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'Telephone'),
              keyboardType: TextInputType.phone,
            ),
          ] else if (_step == 1) ...[
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'pickup', label: Text('Retrait'), icon: Icon(Icons.store_outlined)),
                ButtonSegment(value: 'delivery', label: Text('Livraison'), icon: Icon(Icons.local_shipping_outlined)),
              ],
              selected: {_mode},
              onSelectionChanged: (s) => setState(() => _mode = s.first),
            ),
            if (_mode == 'delivery') ...[
              const SizedBox(height: 12),
              TextFormField(
                controller: _addressController,
                decoration: const InputDecoration(labelText: 'Adresse de livraison'),
                maxLines: 2,
              ),
            ],
          ] else if (_step == 2) ...[
            ...['Mobile Money', 'Carte bancaire', 'Especes en boutique'].map(
              (method) => RadioListTile<String>(
                title: Text(method),
                value: method,
                groupValue: _paymentMethod,
                onChanged: (v) => setState(() => _paymentMethod = v!),
              ),
            ),
          ] else ...[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('${_nameController.text.trim()} - ${_phoneController.text.trim()}'),
                    const SizedBox(height: 8),
                    Text(modeRetrait(_mode)),
                    const SizedBox(height: 8),
                    Text('Paiement: $_paymentMethod'),
                    const Divider(),
                    Text('Total: ${formatPrix(cart.subtotal)}', style: const TextStyle(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    const Row(
                      children: [
                        Icon(Icons.verified_user_outlined, size: 16),
                        SizedBox(width: 6),
                        Expanded(child: Text('Un code QR sera genere par boutique.')),
                      ],
                    ),
                  ],
                ),
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
                OutlinedButton(
                  onPressed: _submitting ? null : () => setState(() => _step--),
                  child: const Text('Retour'),
                ),
              if (_step > 0) const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(_step == 3 ? 'Confirmer et payer' : 'Continuer'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

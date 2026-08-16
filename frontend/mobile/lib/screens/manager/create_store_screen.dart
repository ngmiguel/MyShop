import 'dart:io';
import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/demo/demo_images.dart';
import '../../data/models/preferences.dart';
import '../../data/models/store.dart';
import '../../providers/catalog_provider.dart';
import '../../widgets/map_picker.dart';
import '../../widgets/opening_hours_editor.dart';
import '../../widgets/top_bar.dart';

class CreateStoreScreen extends StatefulWidget {
  const CreateStoreScreen({super.key});

  @override
  State<CreateStoreScreen> createState() => _CreateStoreScreenState();
}

class _CreateStoreScreenState extends State<CreateStoreScreen> {
  static const _steps = [
    'Identité',
    'Catégories',
    'Lieu',
    'Contact',
    'Commerce',
    'Photos',
    'Accès',
    'Résumé',
  ];

  static const _paymentsAll = [
    'Espèces',
    'Mobile Money',
    'Carte bancaire',
    'Virement',
    'Paiement à la livraison',
  ];

  static const _cityCoords = {
    'Douala': (4.0511, 9.7679),
    'Yaoundé': (3.8480, 11.5021),
    'Abidjan': (5.3364, -4.0267),
    'Bafoussam': (5.4737, 10.4177),
    'Garoua': (9.3265, 13.3958),
    'Bamenda': (5.9597, 10.1453),
    'Kribi': (2.9373, 9.9078),
  };

  int _step = 0;
  final _nameController = TextEditingController();
  final _taglineController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _tagsController = TextEditingController();
  final _addressController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _accessController = TextEditingController();

  String _city = 'Douala';
  String _country = 'Cameroun';
  double _lat = 4.0511;
  double _lng = 9.7679;
  final List<String> _categories = [];
  final Set<String> _openDomains = {};
  bool _delivery = true;
  bool _pickup = true;
  double _radiusKm = 10;
  double _deliveryFee = 1500;
  String _currency = 'FCFA';
  final Set<String> _payments = {'Espèces', 'Mobile Money'};
  String _status = 'active';
  List<OpeningHoursDay> _hours = defaultOpeningHours();
  final List<String> _photos = [];
  bool _submitting = false;
  final Map<String, String> _errors = {};
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _accessController.text = _generateCode('');
    if (domainCategories.isNotEmpty) _openDomains.add(domainCategories.first.id);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _taglineController.dispose();
    _descriptionController.dispose();
    _tagsController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _whatsappController.dispose();
    _accessController.dispose();
    super.dispose();
  }

  String _generateCode(String name) {
    final base = name.replaceAll(RegExp(r'[^a-zA-Z]'), '').toUpperCase();
    final prefix = (base.isEmpty ? 'BOUTIK' : base).substring(0, base.isEmpty ? 6 : min(6, base.length));
    return '$prefix-${1000 + Random().nextInt(9000)}';
  }

  String get _mainCategory {
    if (_categories.isEmpty) return 'agro';
    for (final d in domainCategories) {
      if (d.subcategories.contains(_categories.first) || d.name == _categories.first || d.id == _categories.first) {
        return d.id;
      }
    }
    return domainCategories.first.id;
  }

  bool _validateStep() {
    _errors.clear();
    if (_step == 0) {
      if (_nameController.text.trim().length < 3) _errors['nom'] = 'Nom requis (3 caractères min.).';
      if (_descriptionController.text.trim().length < 20) {
        _errors['description'] = 'Description : 20 caractères minimum.';
      }
    }
    if (_step == 1 && _categories.isEmpty) {
      _errors['categories'] = 'Sélectionnez au moins une catégorie.';
    }
    if (_step == 2) {
      if (_addressController.text.trim().length < 5) _errors['adresse'] = 'Adresse physique requise.';
    }
    if (_step == 3) {
      if (!RegExp(r'^[+0-9 ]{8,}$').hasMatch(_phoneController.text.trim())) {
        _errors['telephone'] = 'Téléphone invalide.';
      }
      if (!RegExp(r'^\S+@\S+\.\S+$').hasMatch(_emailController.text.trim())) {
        _errors['email'] = 'E-mail invalide.';
      }
    }
    if (_step == 4 && _payments.isEmpty) {
      _errors['paiements'] = 'Choisissez au moins un moyen de paiement.';
    }
    if (_step == 6 && _accessController.text.trim().length < 6) {
      _errors['acces'] = 'Code d’accès trop court.';
    }
    setState(() {});
    return _errors.isEmpty;
  }

  Future<void> _pickPhotos() async {
    try {
      final files = await _picker.pickMultiImage(imageQuality: 85);
      if (files.isEmpty) return;
      final room = 5 - _photos.length;
      setState(() {
        for (final f in files.take(room)) {
          _photos.add(f.path);
        }
      });
    } catch (_) {
      // fallback: demo gallery
      _addDemoPhotos();
    }
  }

  void _addDemoPhotos() {
    final urls = storePhotoUrls(storeId: 'new-${_nameController.text}', mainCategory: _mainCategory);
    setState(() {
      for (final u in urls) {
        if (_photos.length >= 5) break;
        if (!_photos.contains(u)) _photos.add(u);
      }
    });
  }

  Future<void> _submit() async {
    if (!_validateStep()) return;
    setState(() => _submitting = true);
    try {
      final tags = _tagsController.text
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();
      final catalog = context.read<CatalogProvider>();
      final store = await catalog.createStoreLocally(
        {
          'name': _nameController.text.trim(),
          'tagline': _taglineController.text.trim(),
          'description': _descriptionController.text.trim(),
          'tags': tags,
          'address': _addressController.text.trim(),
          'city': _city,
          'country': _country,
          'phone': _phoneController.text.trim(),
          'email': _emailController.text.trim(),
          'whatsapp': _whatsappController.text.trim().isEmpty
              ? _phoneController.text.trim()
              : _whatsappController.text.trim(),
          'mainCategory': _mainCategory,
          'categories': List<String>.from(_categories),
          'delivery': _delivery,
          'pickup': _pickup,
          'serviceRadiusKm': _delivery ? _radiusKm : null,
          'deliveryFee': _delivery ? _deliveryFee : null,
          'status': _status,
          'paymentMethods': _payments.toList(),
          'currency': _currency,
          'lat': _lat,
          'lng': _lng,
          'photos': List<String>.from(_photos),
          'openingHours': _hours.map((h) => h.toJson()).toList(),
          'accessCode': _accessController.text.trim().toUpperCase(),
        },
        accessCode: _accessController.text.trim().toUpperCase(),
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Boutique « ${store.name} » créée. Code : ${catalog.accessCodeFor(store.id)}')),
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

  Widget _photoThumb(String path, int index) {
    final isFile = !path.startsWith('http');
    return Stack(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: AspectRatio(
            aspectRatio: 1,
            child: isFile
                ? Image.file(File(path), fit: BoxFit.cover)
                : CachedNetworkImage(imageUrl: path, fit: BoxFit.cover),
          ),
        ),
        if (index == 0)
          Positioned(
            left: 4,
            bottom: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(color: Colors.black87, borderRadius: BorderRadius.circular(6)),
              child: const Text('Couverture', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.w800)),
            ),
          ),
        Positioned(
          right: 4,
          top: 4,
          child: InkWell(
            onTap: () => setState(() => _photos.removeAt(index)),
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: const Icon(Icons.close, size: 14),
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final last = _steps.length - 1;
    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Nouvelle boutique',
        subtitle: 'Étape ${_step + 1}/${_steps.length} · ${_steps[_step]}',
        fallbackRoute: '/manager/boutiques',
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Row(
            children: List.generate(
              _steps.length,
              (i) => Expanded(
                child: Container(
                  height: 5,
                  margin: EdgeInsets.only(right: i < last ? 3 : 0),
                  decoration: BoxDecoration(
                    color: i <= _step ? AppTheme.accent500 : AppTheme.ink100,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          if (_step == 0) ...[
            TextField(
              controller: _nameController,
              decoration: InputDecoration(labelText: 'Nom de la boutique *', errorText: _errors['nom']),
              onChanged: (v) => _accessController.text = _generateCode(v),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _taglineController,
              decoration: const InputDecoration(labelText: 'Slogan', helperText: 'Une phrase affichée sous le nom'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descriptionController,
              maxLines: 4,
              decoration: InputDecoration(labelText: 'Description *', errorText: _errors['description']),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _tagsController,
              decoration: const InputDecoration(
                labelText: 'Mots-clés',
                helperText: 'Séparés par des virgules — recherche client',
              ),
            ),
          ] else if (_step == 1) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppTheme.sand100, borderRadius: BorderRadius.circular(12)),
              child: const Text(
                'Une boutique peut vendre jusqu’à 7 catégories, y compris dans des univers différents. La première catégorie choisie définit l’univers principal.',
                style: TextStyle(fontSize: 12, color: AppTheme.ink600, height: 1.35),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Text('${_categories.length}/7 catégories', style: const TextStyle(fontWeight: FontWeight.w700)),
                const Spacer(),
                if (_categories.isNotEmpty)
                  TextButton(onPressed: () => setState(() => _categories.clear()), child: const Text('Tout retirer')),
              ],
            ),
            if (_categories.isNotEmpty) ...[
              const SizedBox(height: 8),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  for (var i = 0; i < _categories.length; i++)
                    Chip(
                      label: Text('${i == 0 ? 'Principale · ' : ''}${_categories[i]}'),
                      backgroundColor: AppTheme.ink900,
                      labelStyle: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700),
                      deleteIcon: const Icon(Icons.close, size: 14, color: Colors.white),
                      onDeleted: () => setState(() => _categories.removeAt(i)),
                    ),
                ],
              ),
            ],
            if (_errors['categories'] != null)
              Padding(
                padding: const EdgeInsets.only(top: 6),
                child: Text(_errors['categories']!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12)),
              ),
            const SizedBox(height: 12),
            ...domainCategories.map((d) {
              final open = _openDomains.contains(d.id);
              final count = d.subcategories.where(_categories.contains).length;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.ink100),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  children: [
                    ListTile(
                      leading: Icon(d.icon),
                      title: Text(d.name, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (count > 0)
                            Container(
                              margin: const EdgeInsets.only(right: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(color: AppTheme.accent500, borderRadius: BorderRadius.circular(999)),
                              child: Text('$count', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800)),
                            ),
                          Text(open ? '−' : '+', style: const TextStyle(fontWeight: FontWeight.w800)),
                        ],
                      ),
                      onTap: () => setState(() {
                        if (open) {
                          _openDomains.remove(d.id);
                        } else {
                          _openDomains.add(d.id);
                        }
                      }),
                    ),
                    if (open)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
                        child: Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: d.subcategories.map((s) {
                            final selected = _categories.contains(s);
                            return FilterChip(
                              label: Text(s),
                              selected: selected,
                              onSelected: (_) {
                                setState(() {
                                  if (selected) {
                                    _categories.remove(s);
                                  } else if (_categories.length >= 7) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Maximum 7 catégories par boutique.')),
                                    );
                                  } else {
                                    _categories.add(s);
                                  }
                                });
                              },
                            );
                          }).toList(),
                        ),
                      ),
                  ],
                ),
              );
            }),
          ] else if (_step == 2) ...[
            TextField(
              controller: _addressController,
              decoration: InputDecoration(labelText: 'Adresse physique *', errorText: _errors['adresse']),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _city,
                    decoration: const InputDecoration(labelText: 'Ville *'),
                    items: onboardingCities.map((v) => DropdownMenuItem(value: v, child: Text(v))).toList(),
                    onChanged: (v) {
                      if (v == null) return;
                      final c = _cityCoords[v];
                      setState(() {
                        _city = v;
                        if (c != null) {
                          _lat = c.$1;
                          _lng = c.$2;
                        }
                      });
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _country,
                    decoration: const InputDecoration(labelText: 'Pays'),
                    items: const [
                      DropdownMenuItem(value: 'Cameroun', child: Text('Cameroun')),
                      DropdownMenuItem(value: "Côte d'Ivoire", child: Text("Côte d'Ivoire")),
                      DropdownMenuItem(value: 'Sénégal', child: Text('Sénégal')),
                    ],
                    onChanged: (v) => setState(() => _country = v ?? _country),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            MapPicker(
              lat: _lat,
              lng: _lng,
              onPick: (la, ln) => setState(() {
                _lat = la;
                _lng = ln;
              }),
            ),
          ] else if (_step == 3) ...[
            TextField(
              controller: _phoneController,
              keyboardType: TextInputType.phone,
              decoration: InputDecoration(labelText: 'Téléphone *', errorText: _errors['telephone']),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(labelText: 'E-mail *', errorText: _errors['email']),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _whatsappController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'WhatsApp',
                helperText: 'Laissez vide pour utiliser le téléphone principal',
              ),
            ),
            const SizedBox(height: 16),
            const Text('Horaires d’ouverture', style: TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            OpeningHoursEditor(
              hours: _hours,
              onChanged: (h) => setState(() => _hours = h),
            ),
          ] else if (_step == 4) ...[
            const Text('Moyens de paiement acceptés *', style: TextStyle(fontWeight: FontWeight.w700)),
            if (_errors['paiements'] != null)
              Text(_errors['paiements']!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 12)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _paymentsAll.map((p) {
                final selected = _payments.contains(p);
                return FilterChip(
                  label: Text(p),
                  selected: selected,
                  onSelected: (_) => setState(() {
                    if (selected) {
                      _payments.remove(p);
                    } else {
                      _payments.add(p);
                    }
                  }),
                );
              }).toList(),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _currency,
              decoration: const InputDecoration(labelText: 'Devise'),
              items: const [
                DropdownMenuItem(value: 'FCFA', child: Text('FCFA')),
                DropdownMenuItem(value: 'EUR', child: Text('EUR')),
                DropdownMenuItem(value: 'USD', child: Text('USD')),
              ],
              onChanged: (v) => setState(() => _currency = v ?? _currency),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Retrait en boutique'),
              value: _pickup,
              onChanged: (v) => setState(() => _pickup = v),
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Proposer la livraison'),
              subtitle: const Text('Les clients pourront choisir la livraison au paiement'),
              value: _delivery,
              onChanged: (v) => setState(() => _delivery = v),
            ),
            if (_delivery) ...[
              Text('Rayon : ${_radiusKm.round()} km', style: const TextStyle(fontWeight: FontWeight.w600)),
              Slider(
                value: _radiusKm,
                min: 1,
                max: 40,
                divisions: 39,
                label: '${_radiusKm.round()} km',
                onChanged: (v) => setState(() => _radiusKm = v),
              ),
              Text('Frais de livraison : ${formatPrix(_deliveryFee)}', style: const TextStyle(fontWeight: FontWeight.w600)),
              Slider(
                value: _deliveryFee,
                min: 0,
                max: 10000,
                divisions: 20,
                label: formatPrix(_deliveryFee),
                onChanged: (v) => setState(() => _deliveryFee = v),
              ),
            ],
          ] else if (_step == 5) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppTheme.sand100, borderRadius: BorderRadius.circular(12)),
              child: const Text(
                'Étape facultative. Ajoutez jusqu’à 5 photos (devanture, intérieur, rayons). La première sert de couverture.',
                style: TextStyle(fontSize: 12, color: AppTheme.ink600, height: 1.35),
              ),
            ),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              children: [
                for (var i = 0; i < _photos.length; i++) _photoThumb(_photos[i], i),
                if (_photos.length < 5)
                  InkWell(
                    onTap: _pickPhotos,
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.ink200, width: 2),
                      ),
                      child: const Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.add_photo_alternate_outlined, color: AppTheme.ink400),
                          SizedBox(height: 4),
                          Text('Ajouter', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppTheme.ink400)),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text('${_photos.length}/5 photo(s)', style: const TextStyle(fontSize: 12, color: AppTheme.ink400)),
            TextButton.icon(
              onPressed: _addDemoPhotos,
              icon: const Icon(Icons.auto_awesome, size: 16),
              label: const Text('Utiliser des photos démo'),
            ),
            if (_photos.isNotEmpty)
              TextButton.icon(
                onPressed: () => setState(() => _photos.clear()),
                icon: const Icon(Icons.delete_outline, size: 16),
                label: const Text('Tout retirer'),
              ),
          ] else if (_step == 6) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppTheme.ink900, borderRadius: BorderRadius.circular(16)),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.shield_outlined, color: AppTheme.accent300, size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Ce mot de passe filtre les inscriptions : seul un vendeur qui le possède peut rejoindre cette boutique.',
                      style: TextStyle(color: AppTheme.ink200, fontSize: 12, height: 1.35),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _accessController,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                labelText: 'Mot de passe d’affiliation *',
                errorText: _errors['acces'],
              ),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: () => setState(() => _accessController.text = _generateCode(_nameController.text)),
              icon: const Icon(Icons.refresh),
              label: const Text('Régénérer'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Statut à la création'),
              items: const [
                DropdownMenuItem(value: 'active', child: Text('Active — visible par les clients')),
                DropdownMenuItem(value: 'brouillon', child: Text('Brouillon — masquée du catalogue')),
              ],
              onChanged: (v) => setState(() => _status = v ?? _status),
            ),
          ] else ...[
            _SummaryBloc(
              title: 'Identité',
              rows: {
                'Nom': _nameController.text,
                'Slogan': _taglineController.text.isEmpty ? '—' : _taglineController.text,
                'Mots-clés': _tagsController.text.isEmpty ? '—' : _tagsController.text,
              },
            ),
            _SummaryBloc(
              title: 'Catégories (${_categories.length}/7)',
              rows: {
                'Principale': _categories.isEmpty ? '—' : _categories.first,
                'Autres': _categories.length <= 1 ? '—' : _categories.skip(1).join(', '),
                'Univers': domainById(_mainCategory)?.name ?? _mainCategory,
              },
            ),
            _SummaryBloc(
              title: 'Localisation',
              rows: {
                'Adresse': '${_addressController.text}, $_city, $_country',
                'Coordonnées': '${_lat.toStringAsFixed(4)}, ${_lng.toStringAsFixed(4)}',
              },
            ),
            _SummaryBloc(
              title: 'Contact',
              rows: {
                'Téléphone': _phoneController.text,
                'E-mail': _emailController.text,
                'Jours ouverts': '${_hours.where((h) => !h.closed).length} / 7',
              },
            ),
            _SummaryBloc(
              title: 'Commerce',
              rows: {
                'Paiements': _payments.join(', '),
                'Devise': _currency,
                'Livraison': _delivery ? '${_radiusKm.round()} km · ${formatPrix(_deliveryFee)}' : 'Non proposée',
              },
            ),
            _SummaryBloc(
              title: 'Photos & accès',
              rows: {
                'Photos': '${_photos.length}/5',
                'Mot de passe': _accessController.text.toUpperCase(),
                'Statut': _status == 'active' ? 'Active' : 'Brouillon',
              },
            ),
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              OutlinedButton(
                onPressed: _submitting
                    ? null
                    : () {
                        if (_step == 0) {
                          context.pop();
                        } else {
                          setState(() => _step--);
                        }
                      },
                child: const Text('Retour'),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: FilledButton(
                  onPressed: _submitting
                      ? null
                      : () {
                          if (!_validateStep()) return;
                          if (_step < last) {
                            setState(() => _step++);
                          } else {
                            _submit();
                          }
                        },
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          _step == last
                              ? 'Créer la boutique'
                              : (_step == 5 && _photos.isEmpty)
                                  ? 'Passer cette étape'
                                  : 'Continuer',
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SummaryBloc extends StatelessWidget {
  const _SummaryBloc({required this.title, required this.rows});

  final String title;
  final Map<String, String> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.cardDecoration(context),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14)),
          const SizedBox(height: 8),
          for (final e in rows.entries)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: Text(e.key, style: const TextStyle(fontSize: 12, color: AppTheme.ink400))),
                  Expanded(
                    child: Text(
                      e.value,
                      textAlign: TextAlign.right,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

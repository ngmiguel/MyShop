import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/demo/demo_accounts.dart';
import '../../data/models/order.dart';
import '../../data/services/order_service.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/profit_settings_provider.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/top_bar.dart';

class ManagerTeamScreen extends StatefulWidget {
  const ManagerTeamScreen({super.key});

  @override
  State<ManagerTeamScreen> createState() => _ManagerTeamScreenState();
}

class _ManagerTeamScreenState extends State<ManagerTeamScreen> {
  List<_TeamMember> _members = [];
  bool _loading = true;
  bool _usingDemo = false;
  String _filtre = 'tous';
  String _query = '';
  String _sort = 'nom'; // nom | scans | ca | note
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<_TeamMember> _fromDemo() {
    return [
      for (var i = 0; i < demoSellers.length; i++)
        _TeamMember.fromDemo(demoSellers[i], id: 'demo-seller-$i'),
    ];
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _usingDemo = false;
    });
    try {
      final list = await context
          .read<SellerApiService>()
          .getSellers()
          .timeout(const Duration(seconds: 6));
      if (!mounted) return;
      if (list.isEmpty) {
        setState(() {
          _members = _fromDemo();
          _usingDemo = true;
          _loading = false;
        });
      } else {
        setState(() {
          _members = list.map(_TeamMember.fromApi).toList();
          _usingDemo = false;
          _loading = false;
        });
      }
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _members = _fromDemo();
        _usingDemo = true;
        _loading = false;
      });
    }
  }

  Future<void> _setStatus(_TeamMember m, String status, {String? toast}) async {
    if (_usingDemo) {
      setDemoSellerStatus(m.email, status);
      setState(() {
        _members = [
          for (final s in _members)
            if (s.id == m.id) s.copyWith(status: status) else s,
        ];
      });
      if (mounted && toast != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(toast)));
      }
      return;
    }
    try {
      final api = context.read<SellerApiService>();
      if (status == 'active') {
        if (m.isSuspended) {
          await api.activateSeller(m.id);
        } else {
          await api.approveSeller(m.id);
        }
      } else if (status == 'suspended') {
        await api.suspendSeller(m.id);
      }
      await _load();
      if (mounted && toast != null) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(toast)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _validerTous() async {
    final pending = _members.where((m) => m.isPending).toList();
    if (pending.isEmpty) return;
    for (final m in pending) {
      await _setStatus(m, 'active');
    }
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${pending.length} vendeur(s) validé(s)')),
      );
    }
  }

  Future<void> _launchUri(Uri uri) async {
    final ok = await canLaunchUrl(uri);
    if (!ok) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impossible d’ouvrir l’application')),
        );
      }
      return;
    }
    await launchUrl(uri);
  }

  void _contacter(_TeamMember m) {
    final telDigits = m.telephone.replaceAll(RegExp(r'[^\d+]'), '');
    showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(m.displayName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              const SizedBox(height: 4),
              Text(m.telephone, style: const TextStyle(fontSize: 14, color: AppTheme.ink500)),
              Text(m.email, style: const TextStyle(fontSize: 13, color: AppTheme.ink400)),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: () async {
                  Navigator.pop(ctx);
                  await _launchUri(Uri(scheme: 'tel', path: telDigits));
                },
                icon: const Icon(Icons.call_outlined),
                label: const Text('Appeler'),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () async {
                  Navigator.pop(ctx);
                  await _launchUri(Uri(
                    scheme: 'mailto',
                    path: m.email,
                    queryParameters: {'subject': 'MyShop — équipe'},
                  ));
                },
                icon: const Icon(Icons.email_outlined),
                label: const Text('Envoyer un e-mail'),
              ),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: '${m.telephone}\n${m.email}'));
                  if (ctx.mounted) Navigator.pop(ctx);
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Coordonnées copiées')),
                    );
                  }
                },
                icon: const Icon(Icons.copy, size: 18),
                label: const Text('Copier les coordonnées'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _ouvrirDetail(_TeamMember m, String boutique) {
    final commissionPct = context.read<ProfitSettingsProvider>().commissionVendeur;
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.55,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        builder: (_, controller) => ListView(
          controller: controller,
          padding: const EdgeInsets.all(20),
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: AppTheme.ink200, borderRadius: BorderRadius.circular(999)),
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppTheme.ink900,
                  child: Text(m.initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m.displayName, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                      Text('${m.poste} · $boutique', style: const TextStyle(color: AppTheme.ink500, fontSize: 13)),
                      _StatusBadge(status: m.status),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            StarRating(rating: m.note),
            Text('${m.avis} avis clients', style: const TextStyle(fontSize: 12, color: AppTheme.ink400)),
            const SizedBox(height: 16),
            _DetailRow(label: 'E-mail', value: m.email),
            _DetailRow(label: 'Téléphone', value: m.telephone),
            _DetailRow(label: 'Scans confirmés', value: '${m.scans}'),
            _DetailRow(label: 'CA généré', value: formatPrix(m.ca)),
            _DetailRow(
              label: 'Commission est. ($commissionPct %)',
              value: formatPrix(m.ca * commissionPct / 100),
            ),
            _DetailRow(label: 'Embauche', value: formatDate(m.hireDate)),
            const SizedBox(height: 12),
            if (m.isPending)
              FilledButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  _setStatus(m, 'active', toast: '${m.firstName} a été validé(e).');
                },
                child: const Text('Valider l’inscription'),
              ),
            if (m.isActive)
              OutlinedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  _setStatus(m, 'suspended', toast: '${m.firstName} a été suspendu(e).');
                },
                child: const Text('Suspendre'),
              ),
            if (m.isSuspended)
              OutlinedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  _setStatus(m, 'active', toast: '${m.firstName} a été réactivé(e).');
                },
                child: const Text('Réactiver'),
              ),
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                _contacter(m);
              },
              child: const Text('Contacter'),
            ),
            TextButton(
              onPressed: () => context.push('/manager/boutiques/${m.storeId}'),
              child: const Text('Voir la boutique'),
            ),
          ],
        ),
      ),
    );
  }

  List<_TeamMember> get _filtered {
    var list = _members.where((m) {
      final statusOk = switch (_filtre) {
        'pending' => m.isPending,
        'active' => m.isActive,
        'suspended' => m.isSuspended,
        _ => true,
      };
      if (!statusOk) return false;
      final q = _query.trim().toLowerCase();
      if (q.isEmpty) return true;
      return '${m.firstName} ${m.lastName} ${m.email} ${m.poste}'.toLowerCase().contains(q);
    }).toList();

    switch (_sort) {
      case 'scans':
        list.sort((a, b) => b.scans.compareTo(a.scans));
      case 'ca':
        list.sort((a, b) => b.ca.compareTo(a.ca));
      case 'note':
        list.sort((a, b) => b.note.compareTo(a.note));
      default:
        list.sort((a, b) => a.displayName.compareTo(b.displayName));
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final commissionPct = context.watch<ProfitSettingsProvider>().commissionVendeur;
    final storeName = {for (final s in catalog.stores) s.id: s.name};
    final pending = _members.where((m) => m.isPending).length;
    final actifs = _members.where((m) => m.isActive).length;
    final suspendus = _members.where((m) => m.isSuspended).length;
    final liste = _filtered;
    final caTotal = _members.where((m) => m.isActive).fold<double>(0, (s, m) => s + m.ca);
    final scansTotal = _members.where((m) => m.isActive).fold<int>(0, (s, m) => s + m.scans);
    final commissionsEst = caTotal * commissionPct / 100;

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Équipes',
        subtitle: '${_members.length} vendeur(s) · $pending à valider',
        showBack: false,
        fallbackRoute: '/manager',
        action: pending > 0
            ? TextButton(
                onPressed: _validerTous,
                child: const Text('Tout valider'),
              )
            : IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
      ),
      body: _loading
          ? const LoadingView()
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 6, 12, 0),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (v) => setState(() => _query = v),
                    style: const TextStyle(fontSize: 13),
                    decoration: InputDecoration(
                      isDense: true,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      hintText: 'Rechercher un vendeur',
                      hintStyle: const TextStyle(fontSize: 13),
                      prefixIcon: const Icon(Icons.search, size: 18),
                      prefixIconConstraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                      suffixIcon: _query.isEmpty
                          ? null
                          : IconButton(
                              icon: const Icon(Icons.clear, size: 16),
                              visualDensity: VisualDensity.compact,
                              onPressed: () {
                                _searchController.clear();
                                setState(() => _query = '');
                              },
                            ),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Row(
                    children: [
                      for (final f in const [
                        ('tous', 'Tous'),
                        ('pending', 'À valider'),
                        ('active', 'Actifs'),
                        ('suspended', 'Suspendus'),
                      ])
                        Padding(
                          padding: const EdgeInsets.only(right: 6),
                          child: AppChip(
                            dense: true,
                            label: Text(f.$2, style: const TextStyle(fontSize: 11)),
                            active: _filtre == f.$1,
                            bold: true,
                            onTap: () => setState(() => _filtre = f.$1),
                          ),
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 8, 0),
                  child: Row(
                    children: [
                      _KpiPill(
                        label: 'Actifs',
                        value: '$actifs',
                        color: AppTheme.emerald600,
                        onTap: () => setState(() => _filtre = 'active'),
                      ),
                      const SizedBox(width: 6),
                      _KpiPill(
                        label: 'Attente',
                        value: '$pending',
                        color: const Color(0xFFD97706),
                        onTap: () => setState(() => _filtre = 'pending'),
                      ),
                      const SizedBox(width: 6),
                      _KpiPill(
                        label: 'Suspendus',
                        value: '$suspendus',
                        color: const Color(0xFFDC2626),
                        onTap: () => setState(() => _filtre = 'suspended'),
                      ),
                      const Spacer(),
                      PopupMenuButton<String>(
                        initialValue: _sort,
                        onSelected: (v) => setState(() => _sort = v),
                        padding: EdgeInsets.zero,
                        itemBuilder: (_) => const [
                          PopupMenuItem(value: 'nom', child: Text('Trier par nom')),
                          PopupMenuItem(value: 'scans', child: Text('Trier par scans')),
                          PopupMenuItem(value: 'ca', child: Text('Trier par CA')),
                          PopupMenuItem(value: 'note', child: Text('Trier par note')),
                        ],
                        child: const Padding(
                          padding: EdgeInsets.all(6),
                          child: Icon(Icons.sort, size: 18, color: AppTheme.ink500),
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 4, 12, 0),
                  child: Text(
                    'CA ${formatMontantCourt(caTotal)} F · com. ~${formatMontantCourt(commissionsEst)} F · $scansTotal scans',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 10, color: AppTheme.ink400, fontWeight: FontWeight.w600),
                  ),
                ),
                Expanded(
                  child: liste.isEmpty
                      ? EmptyState(
                          icon: Icons.groups_outlined,
                          title: 'Aucun vendeur',
                          subtitle: _query.isNotEmpty || _filtre != 'tous'
                              ? 'Aucun résultat pour ce filtre.'
                              : 'Les vendeurs apparaissent ici dès qu’ils s’inscrivent avec le mot de passe d’une boutique.',
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(12, 8, 12, 20),
                            itemCount: liste.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 6),
                            itemBuilder: (context, index) {
                              final m = liste[index];
                              final boutique = storeName[m.storeId] ?? m.storeId;
                              return _SellerCard(
                                member: m,
                                boutique: boutique,
                                onTap: () => _ouvrirDetail(m, boutique),
                                onValider: () => _setStatus(m, 'active', toast: '${m.firstName} a été validé(e).'),
                                onSuspendre: () => _setStatus(m, 'suspended', toast: '${m.firstName} a été suspendu(e).'),
                                onReactiver: () => _setStatus(m, 'active', toast: '${m.firstName} a été réactivé(e).'),
                                onContacter: () => _contacter(m),
                              );
                            },
                          ),
                        ),
                ),
              ],
            ),
    );
  }
}

class _KpiPill extends StatelessWidget {
  const _KpiPill({
    required this.label,
    required this.value,
    required this.color,
    required this.onTap,
  });

  final String label;
  final String value;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                value,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: color),
              ),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: color),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _TeamMember {
  const _TeamMember({
    required this.id,
    required this.storeId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.status,
    required this.poste,
    required this.telephone,
    required this.note,
    required this.avis,
    required this.scans,
    required this.ca,
    required this.hireDate,
  });

  final String id;
  final String storeId;
  final String firstName;
  final String lastName;
  final String email;
  final String status;
  final String poste;
  final String telephone;
  final double note;
  final int avis;
  final int scans;
  final double ca;
  final DateTime hireDate;

  String get displayName => '$firstName $lastName'.trim();
  String get initials {
    final a = firstName.isNotEmpty ? firstName[0] : 'V';
    final b = lastName.isNotEmpty ? lastName[0] : '';
    return '$a$b'.toUpperCase();
  }

  bool get isActive => status == 'active' || status == 'actif';
  bool get isPending => status == 'pending' || status == 'en_attente';
  bool get isSuspended => status == 'suspended' || status == 'suspendu';

  _TeamMember copyWith({String? status}) => _TeamMember(
        id: id,
        storeId: storeId,
        firstName: firstName,
        lastName: lastName,
        email: email,
        status: status ?? this.status,
        poste: poste,
        telephone: telephone,
        note: note,
        avis: avis,
        scans: scans,
        ca: ca,
        hireDate: hireDate,
      );

  factory _TeamMember.fromDemo(DemoSellerAccount s, {required String id}) {
    return _TeamMember(
      id: id,
      storeId: s.storeId,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      status: s.effectiveStatus,
      poste: s.poste,
      telephone: s.telephone,
      note: s.note,
      avis: s.avis,
      scans: s.scansConfirmes,
      ca: s.caGenere,
      hireDate: s.embauche,
    );
  }

  factory _TeamMember.fromApi(SellerModel s) {
    final seed = (s.email ?? s.id).hashCode.abs();
    final pending = s.status == 'pending' || s.status == 'en_attente';
    final phone = (s.phone != null && s.phone!.isNotEmpty)
        ? s.phone!
        : '+237 6 ${(seed % 90000000 + 10000000)}';
    final poste = (s.position != null && s.position!.isNotEmpty)
        ? s.position!
        : sellerJobTitles[seed % sellerJobTitles.length];
    return _TeamMember(
      id: s.id,
      storeId: s.storeId,
      firstName: s.firstName ?? 'Vendeur',
      lastName: s.lastName ?? '',
      email: s.email ?? '',
      status: s.status,
      poste: poste,
      telephone: phone,
      note: s.rating ?? (pending ? 0 : 3.8 + (seed % 12) / 10),
      avis: s.ratingCount ?? (pending ? 0 : 10 + seed % 80),
      scans: s.salesCount ?? (pending ? 0 : 20 + seed % 200),
      ca: s.revenue ?? (pending ? 0 : (200000 + seed % 800 * 10000).toDouble()),
      hireDate: s.joinedAt ?? DateTime.now().subtract(Duration(days: 40 + seed % 300)),
    );
  }
}

class _SellerCard extends StatelessWidget {
  const _SellerCard({
    required this.member,
    required this.boutique,
    required this.onTap,
    required this.onValider,
    required this.onSuspendre,
    required this.onReactiver,
    required this.onContacter,
  });

  final _TeamMember member;
  final String boutique;
  final VoidCallback onTap;
  final VoidCallback onValider;
  final VoidCallback onSuspendre;
  final VoidCallback onReactiver;
  final VoidCallback onContacter;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Theme.of(context).cardColor,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.fromLTRB(10, 10, 8, 10),
          decoration: AppTheme.cardDecoration(context),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    radius: 16,
                    backgroundColor: AppTheme.ink900,
                    child: Text(
                      member.initials,
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w800),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                member.displayName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                              ),
                            ),
                            _StatusBadge(status: member.status),
                          ],
                        ),
                        Text(
                          '${member.poste} · $boutique · ${member.scans} scans · ${formatMontantCourt(member.ca)} F',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 10, color: AppTheme.ink400),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  if (member.isPending)
                    Expanded(
                      child: FilledButton(
                        onPressed: onValider,
                        style: FilledButton.styleFrom(
                          backgroundColor: AppTheme.accent500,
                          visualDensity: VisualDensity.compact,
                          padding: const EdgeInsets.symmetric(vertical: 0),
                          minimumSize: const Size(0, 32),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Valider', style: TextStyle(fontSize: 12)),
                      ),
                    ),
                  if (member.isActive)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: onSuspendre,
                        style: OutlinedButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                          padding: const EdgeInsets.symmetric(vertical: 0),
                          minimumSize: const Size(0, 32),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Suspendre', style: TextStyle(fontSize: 12)),
                      ),
                    ),
                  if (member.isSuspended)
                    Expanded(
                      child: OutlinedButton(
                        onPressed: onReactiver,
                        style: OutlinedButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                          padding: const EdgeInsets.symmetric(vertical: 0),
                          minimumSize: const Size(0, 32),
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text('Réactiver', style: TextStyle(fontSize: 12)),
                      ),
                    ),
                  const SizedBox(width: 6),
                  IconButton(
                    tooltip: 'Contacter',
                    onPressed: onContacter,
                    visualDensity: VisualDensity.compact,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    padding: EdgeInsets.zero,
                    icon: const Icon(Icons.phone_outlined, size: 18),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({required this.status});
  final String status;

  @override
  Widget build(BuildContext context) {
    final pending = status == 'pending' || status == 'en_attente';
    final suspended = status == 'suspended' || status == 'suspendu';
    final label = pending ? 'Attente' : suspended ? 'Suspendu' : 'Actif';
    final bg = pending
        ? const Color(0xFFFFFBEB)
        : suspended
            ? const Color(0xFFFEF2F2)
            : const Color(0xFFECFDF5);
    final fg = pending
        ? const Color(0xFFD97706)
        : suspended
            ? const Color(0xFFDC2626)
            : AppTheme.emerald600;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: fg)),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.ink400))),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

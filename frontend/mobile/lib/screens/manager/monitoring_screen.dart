import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/theme/app_theme.dart';
import '../../data/services/analytics_service.dart';
import '../../widgets/app_layout.dart';
import '../../widgets/common_widgets.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/top_bar.dart';

class ManagerMonitoringScreen extends StatefulWidget {
  const ManagerMonitoringScreen({super.key});

  @override
  State<ManagerMonitoringScreen> createState() => _ManagerMonitoringScreenState();
}

class _ManagerMonitoringScreenState extends State<ManagerMonitoringScreen> {
  Map<String, dynamic>? _data;
  bool _loading = true;
  String? _error;
  String _filtre = 'all'; // all | errors | pending
  String _query = '';
  final Set<String> _acked = {};
  int _latencyThreshold = 800;

  @override
  void initState() {
    super.initState();
    _loadPrefs();
    _load();
  }

  Future<void> _loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() => _latencyThreshold = prefs.getInt('mgr_latency') ?? 800);
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      _data = await context.read<AnalyticsService>().getMonitoring();
    } catch (e) {
      _error = e.toString();
      _data = _demoFallback();
    }
    if (mounted) setState(() => _loading = false);
  }

  Map<String, dynamic> _demoFallback() {
    return {
      'globalStatus': 'degraded',
      'availability': 98.4,
      'avgLatencyMs': 420,
      'errorCount': 3,
      'qrQueue': 7,
      'services': [
        {'name': 'Auth', 'status': 'operational', 'latencyMs': 120},
        {'name': 'Catalog', 'status': 'operational', 'latencyMs': 180},
        {'name': 'Orders', 'status': 'degraded', 'latencyMs': 920},
        {'name': 'Sellers', 'status': 'operational', 'latencyMs': 210},
        {'name': 'Analytics', 'status': 'up', 'latencyMs': 340},
      ],
      'recentEvents': [
        {'id': 'e1', 'level': 'error', 'service': 'Orders', 'message': 'Timeout checkout 2.1s', 'acked': false},
        {'id': 'e2', 'level': 'warning', 'service': 'Orders', 'message': 'Latence > seuil', 'acked': false},
        {'id': 'e3', 'level': 'info', 'service': 'Catalog', 'message': 'Sync feed OK', 'acked': true},
        {'id': 'e4', 'level': 'error', 'service': 'Auth', 'message': '3 tentatives login échouées', 'acked': false},
      ],
    };
  }

  List<Map<String, dynamic>> get _events {
    final raw = (_data?['recentEvents'] as List?) ?? const [];
    return raw.map((e) {
      if (e is Map<String, dynamic>) return e;
      if (e is Map) return Map<String, dynamic>.from(e);
      return {'id': e.hashCode.toString(), 'level': 'info', 'service': 'System', 'message': e.toString(), 'acked': false};
    }).toList();
  }

  List<Map<String, dynamic>> get _filteredEvents {
    return _events.where((e) {
      final id = e['id']?.toString() ?? '';
      final acked = _acked.contains(id) || e['acked'] == true;
      final level = (e['level']?.toString() ?? 'info').toLowerCase();
      final statusOk = switch (_filtre) {
        'errors' => level == 'error',
        'pending' => !acked && (level == 'error' || level == 'warning'),
        _ => true,
      };
      if (!statusOk) return false;
      final q = _query.trim().toLowerCase();
      if (q.isEmpty) return true;
      return '${e['service']} ${e['message']}'.toLowerCase().contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final services = (_data?['services'] as List?)?.cast<Map<String, dynamic>>() ??
        ((_data?['services'] as List?)?.map((e) => Map<String, dynamic>.from(e as Map)).toList() ?? []);
    final availability = (_data?['availability'] as num?)?.toDouble() ?? 99.0;
    final latency = (_data?['avgLatencyMs'] as num?)?.toInt() ?? 0;
    final errors = (_data?['errorCount'] as num?)?.toInt() ?? _events.where((e) => e['level'] == 'error').length;
    final qrQueue = (_data?['qrQueue'] as num?)?.toInt() ?? 0;
    final pendingAck = _events.where((e) {
      final id = e['id']?.toString() ?? '';
      return !_acked.contains(id) && e['acked'] != true && (e['level'] == 'error' || e['level'] == 'warning');
    }).length;

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Monitoring',
        subtitle: _data?['globalStatus']?.toString() ?? 'Chargement…',
        action: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              tooltip: 'Exporter journal',
              icon: const Icon(Icons.download_outlined),
              onPressed: () async {
                final csv = _events.map((e) => '${e['level']};${e['service']};${e['message']}').join('\n');
                await Clipboard.setData(ClipboardData(text: 'level;service;message\n$csv'));
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Journal CSV copié')));
                }
              },
            ),
            IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
          ],
        ),
      ),
      body: _loading
          ? const LoadingView(message: 'Vérification des services…')
          : _error != null && _data == null
              ? EmptyState(
                  icon: Icons.error_outline,
                  title: 'Erreur',
                  subtitle: _error,
                  action: ElevatedButton(onPressed: _load, child: const Text('Réessayer')),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: AppTheme.ink900, borderRadius: BorderRadius.circular(16)),
                      child: Row(
                        children: [
                          Icon(
                            _data?['globalStatus'] == 'operational'
                                ? Icons.check_circle_outline
                                : Icons.warning_amber_outlined,
                            color: AppTheme.emerald400,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Statut global : ${_data?['globalStatus'] ?? 'inconnu'}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            label: 'Disponibilité',
                            value: '${availability.toStringAsFixed(1)} %',
                            icon: Icons.cloud_done_outlined,
                            tone: StatTone.success,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: StatCard(
                            label: 'Latence moy.',
                            value: '${latency} ms',
                            icon: Icons.speed_outlined,
                            tone: latency > _latencyThreshold ? StatTone.danger : StatTone.info,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: StatCard(
                            label: 'Erreurs',
                            value: '$errors',
                            icon: Icons.error_outline,
                            tone: StatTone.danger,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: StatCard(
                            label: 'File QR',
                            value: '$qrQueue',
                            icon: Icons.qr_code_outlined,
                            tone: StatTone.warning,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    const SectionHeader(title: 'Services', padding: EdgeInsets.zero),
                    const SizedBox(height: 8),
                    ...services.map((service) {
                      final status = service['status']?.toString() ?? 'unknown';
                      final ok = status == 'up' || status == 'operational';
                      final lat = (service['latencyMs'] as num?)?.toInt() ?? 0;
                      final slow = lat > _latencyThreshold;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: AppTheme.cardDecoration(context),
                        child: ListTile(
                          leading: Icon(
                            ok && !slow ? Icons.check_circle_outline : Icons.error_outline,
                            color: ok && !slow ? AppTheme.emerald600 : Colors.red,
                          ),
                          title: Text(service['name']?.toString() ?? 'Service', style: const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text('Latence : $lat ms${slow ? ' · seuil $_latencyThreshold ms' : ''}'),
                          trailing: Text(
                            status.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: ok ? AppTheme.emerald600 : Colors.red,
                            ),
                          ),
                        ),
                      );
                    }),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: SectionHeader(
                            title: 'Journal ($pendingAck à traiter)',
                            padding: EdgeInsets.zero,
                          ),
                        ),
                        if (pendingAck > 0)
                          TextButton(
                            onPressed: () {
                              setState(() {
                                for (final e in _events) {
                                  final id = e['id']?.toString();
                                  if (id != null) _acked.add(id);
                                }
                              });
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Toutes les alertes acquittées')),
                              );
                            },
                            child: const Text('Tout acquitter'),
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          for (final f in const [
                            ('all', 'Tout'),
                            ('pending', 'Non traitées'),
                            ('errors', 'Erreurs'),
                          ]) ...[
                            AppChip(
                              label: Text(f.$2),
                              active: _filtre == f.$1,
                              bold: true,
                              onTap: () => setState(() => _filtre = f.$1),
                            ),
                            const SizedBox(width: 8),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      onChanged: (v) => setState(() => _query = v),
                      decoration: const InputDecoration(
                        hintText: 'Filtrer le journal…',
                        prefixIcon: Icon(Icons.search, size: 20),
                      ),
                    ),
                    const SizedBox(height: 8),
                    ..._filteredEvents.map((e) {
                      final id = e['id']?.toString() ?? '';
                      final acked = _acked.contains(id) || e['acked'] == true;
                      final level = e['level']?.toString() ?? 'info';
                      final color = level == 'error'
                          ? const Color(0xFFDC2626)
                          : level == 'warning'
                              ? const Color(0xFFD97706)
                              : AppTheme.ink400;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: AppTheme.cardDecoration(context),
                        child: ListTile(
                          leading: Icon(
                            level == 'error'
                                ? Icons.error_outline
                                : level == 'warning'
                                    ? Icons.warning_amber_outlined
                                    : Icons.info_outline,
                            color: color,
                          ),
                          title: Text(e['message']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                          subtitle: Text('${e['service']} · $level${acked ? ' · acquitté' : ''}'),
                          trailing: acked
                              ? const Icon(Icons.check, color: AppTheme.emerald600, size: 18)
                              : IconButton(
                                  tooltip: 'Acquitter',
                                  icon: const Icon(Icons.done_all, size: 20),
                                  onPressed: () => setState(() => _acked.add(id)),
                                ),
                        ),
                      );
                    }),
                  ],
                ),
    );
  }
}

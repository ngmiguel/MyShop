import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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

  @override
  void initState() {
    super.initState();
    _load();
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
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final services = (_data?['services'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    return Scaffold(
      backgroundColor: AppTheme.contentBackground(context),
      appBar: TopBar(
        title: 'Monitoring',
        subtitle: _data?['globalStatus']?.toString() ?? 'Chargement...',
        action: IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
      ),
      body: _loading
          ? const LoadingView(message: 'Verification des services...')
          : _error != null
              ? EmptyState(icon: Icons.error_outline, title: 'Erreur', subtitle: _error, action: ElevatedButton(onPressed: _load, child: const Text('Reessayer')))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: AppTheme.ink900, borderRadius: BorderRadius.circular(16)),
                      child: Row(
                        children: [
                          Icon(
                            _data?['globalStatus'] == 'operational' ? Icons.check_circle_outline : Icons.warning_amber_outlined,
                            color: AppTheme.emerald400,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Statut global: ${_data?['globalStatus'] ?? 'inconnu'}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    ...services.map((service) {
                      final status = service['status']?.toString() ?? 'unknown';
                      final ok = status == 'up' || status == 'operational';
                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        decoration: AppTheme.cardDecoration(context),
                        child: ListTile(
                          leading: Icon(ok ? Icons.check_circle_outline : Icons.error_outline, color: ok ? AppTheme.emerald600 : Colors.red),
                          title: Text(service['name']?.toString() ?? 'Service', style: const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text('Latence: ${service['latencyMs'] ?? '-'} ms'),
                          trailing: Text(status.toUpperCase(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: ok ? AppTheme.emerald600 : Colors.red)),
                        ),
                      );
                    }),
                    const SectionHeader(title: 'Journal systeme'),
                    ...((_data?['recentEvents'] as List?) ?? const []).map(
                      (e) => ListTile(
                        dense: true,
                        title: Text(e.toString()),
                      ),
                    ),
                  ],
                ),
    );
  }
}

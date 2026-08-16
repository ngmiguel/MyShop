import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';

/// Sélecteur de position type prototype (carte OSM + pin déplaçable).
class MapPicker extends StatelessWidget {
  const MapPicker({
    super.key,
    required this.lat,
    required this.lng,
    required this.onPick,
    this.height = 220,
  });

  final double lat;
  final double lng;
  final void Function(double lat, double lng) onPick;
  final double height;

  static const _span = 0.045;

  @override
  Widget build(BuildContext context) {
    final url =
        'https://staticmap.openstreetmap.de/staticmap.php?center=$lat,$lng&zoom=14&size=640x360&maptype=mapnik&markers=$lat,$lng,red-pushpin';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Position sur la carte *',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(16),
          child: Container(
            height: height,
            decoration: BoxDecoration(
              border: Border.all(color: AppTheme.ink100),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Stack(
              fit: StackFit.expand,
              children: [
                CachedNetworkImage(
                  imageUrl: url,
                  fit: BoxFit.cover,
                  errorWidget: (_, _, _) => Container(
                    color: AppTheme.ink100,
                    child: const Center(child: Icon(Icons.map_outlined, size: 40, color: AppTheme.ink300)),
                  ),
                ),
                Positioned.fill(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTapDown: (details) {
                      final box = context.findRenderObject() as RenderBox?;
                      if (box == null) return;
                      // Approximate: use child size from gesture local position relative to map height.
                    },
                    onTapUp: (details) {
                      final size = Size(MediaQuery.sizeOf(context).width - 32, height);
                      final dx = (details.localPosition.dx / size.width).clamp(0.0, 1.0);
                      final dy = (details.localPosition.dy / size.height).clamp(0.0, 1.0);
                      final newLng = lng - _span + dx * _span * 2;
                      final newLat = lat + _span - dy * _span * 2;
                      onPick(newLat, newLng);
                    },
                  ),
                ),
                const IgnorePointer(
                  child: Center(
                    child: Icon(Icons.location_on, color: Color(0xFFDC2626), size: 36),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Touchez la carte pour déplacer le repère · ${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}',
          style: const TextStyle(fontSize: 12, color: AppTheme.ink400),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _Nudge(icon: Icons.arrow_upward, onTap: () => onPick(lat + 0.002, lng)),
            _Nudge(icon: Icons.arrow_downward, onTap: () => onPick(lat - 0.002, lng)),
            _Nudge(icon: Icons.arrow_back, onTap: () => onPick(lat, lng - 0.002)),
            _Nudge(icon: Icons.arrow_forward, onTap: () => onPick(lat, lng + 0.002)),
            const Spacer(),
            TextButton(
              onPressed: () => onPick(lat, lng),
              child: const Text('Recentrer'),
            ),
          ],
        ),
      ],
    );
  }
}

class _Nudge extends StatelessWidget {
  const _Nudge({required this.icon, required this.onTap});
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      icon: Icon(icon, size: 18),
      style: IconButton.styleFrom(
        backgroundColor: AppTheme.ink50,
        visualDensity: VisualDensity.compact,
      ),
    );
  }
}

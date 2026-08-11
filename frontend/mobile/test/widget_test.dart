import 'package:flutter_test/flutter_test.dart';

import 'package:myshop_mobile/app.dart';

void main() {
  testWidgets('MyShop app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const MyShopApp());
    await tester.pump();
    expect(find.text('Chargement de MyShop...'), findsOneWidget);
  });
}

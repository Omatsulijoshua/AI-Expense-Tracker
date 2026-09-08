import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:expense_tracker_mobile/main.dart';

void main() {
  testWidgets('Expense Tracker App renders dashboard title', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: ExpenseTrackerApp(),
      ),
    );

    expect(find.text('Expense Tracker'), findsOneWidget);
    expect(find.text('Total Net Balance'), findsOneWidget);
  });
}

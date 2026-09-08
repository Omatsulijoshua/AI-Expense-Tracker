import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../../core/sync/sync_status_badge.dart';

final healthScoreProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/ai-advanced/health-score');
  return Map<String, dynamic>.from(response.data);
});

final anomaliesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/ai-advanced/anomalies');
  return response.data as List? ?? [];
});

final subscriptionsProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/ai-advanced/subscriptions');
  return response.data as List? ?? [];
});

final forecastProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.client.get('/ai-advanced/forecast');
  return response.data as List? ?? [];
});

class AdvancedAiScreen extends ConsumerWidget {
  const AdvancedAiScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final healthAsync = ref.watch(healthScoreProvider);
    final anomaliesAsync = ref.watch(anomaliesProvider);
    final subsAsync = ref.watch(subscriptionsProvider);
    final forecastAsync = ref.watch(forecastProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Advanced AI Insights'),
      ),
      body: Column(
        children: [
          const SyncStatusBadge(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // SECTION 1: FINANCIAL HEALTH SCORE
                  healthAsync.when(
                    data: (health) {
                      final score = (health['score'] as num? ?? 85).toInt();
                      final rating = health['rating'] ?? 'GOOD';
                      final recs = (health['recommendations'] as List? ?? []);

                      Color scoreColor = Colors.green;
                      if (score < 55) {
                        scoreColor = Colors.red;
                      } else if (score < 75) {
                        scoreColor = Colors.orange;
                      }

                      return Card(
                        elevation: 3,
                        color: scoreColor.withValues(alpha: 0.1),
                        child: Padding(
                          padding: const EdgeInsets.all(20.0),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Financial Health Score', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                      const SizedBox(height: 4),
                                      Text('Rating: $rating', style: TextStyle(color: scoreColor, fontWeight: FontWeight.bold, fontSize: 14)),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: scoreColor,
                                    ),
                                    child: Text(
                                      '$score',
                                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22),
                                    ),
                                  ),
                                ],
                              ),
                              const Divider(height: 24),
                              Align(
                                alignment: Alignment.centerLeft,
                                child: Text('AI Recommendations:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey.shade800)),
                              ),
                              const SizedBox(height: 6),
                              ...recs.map((rec) => Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 2.0),
                                    child: Row(
                                      children: [
                                        Icon(Icons.lightbulb_outline, size: 16, color: scoreColor),
                                        const SizedBox(width: 6),
                                        Expanded(child: Text(rec.toString(), style: const TextStyle(fontSize: 12))),
                                      ],
                                    ),
                                  )),
                            ],
                          ),
                        ),
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, _) => Text('Error loading Health Score: $err'),
                  ),

                  const SizedBox(height: 24),

                  // SECTION 2: ANOMALIES & UNUSUAL CHARGES
                  Text('Detected Anomalies & Alerts', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  anomaliesAsync.when(
                    data: (anomalies) {
                      if (anomalies.isEmpty) {
                        return const Card(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: Row(
                              children: [
                                Icon(Icons.check_circle, color: Colors.green),
                                SizedBox(width: 12),
                                Text('No spending anomalies or duplicate charges detected!'),
                              ],
                            ),
                          ),
                        );
                      }

                      return ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: anomalies.length,
                        itemBuilder: (context, idx) {
                          final item = anomalies[idx];
                          final isHigh = item['severity'] == 'HIGH';

                          return Card(
                            color: isHigh ? Colors.red.shade50 : Colors.amber.shade50,
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: Icon(
                                isHigh ? Icons.warning_amber_rounded : Icons.info_outline,
                                color: isHigh ? Colors.red : Colors.orange.shade800,
                              ),
                              title: Text(item['merchant'] ?? 'Unusual Charge', style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text(item['reason'] ?? '', style: const TextStyle(fontSize: 12)),
                              trailing: Text('₦${item['amount']}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red)),
                            ),
                          );
                        },
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, _) => Text('Error: $err'),
                  ),

                  const SizedBox(height: 24),

                  // SECTION 3: RECURRING SUBSCRIPTIONS
                  Text('Active Recurring Subscriptions', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  subsAsync.when(
                    data: (subs) {
                      if (subs.isEmpty) {
                        return const Card(
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: Text('No recurring subscriptions detected.'),
                          ),
                        );
                      }

                      final totalSubCost = subs.reduce((sum, s) => sum + (s['averageAmount'] as num? ?? 0)) as num;

                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Monthly Subscriptions Total', style: TextStyle(fontWeight: FontWeight.bold)),
                                  Text('₦${totalSubCost.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.purple, fontSize: 16)),
                                ],
                              ),
                              const Divider(height: 20),
                              ...subs.map((s) => ListTile(
                                    contentPadding: EdgeInsets.zero,
                                    leading: const CircleAvatar(
                                      backgroundColor: Colors.purple,
                                      child: Icon(Icons.repeat, color: Colors.white, size: 20),
                                    ),
                                    title: Text(s['merchant'] ?? 'Subscription', style: const TextStyle(fontWeight: FontWeight.bold)),
                                    subtitle: Text('Frequency: ${s['frequency']} • Category: ${s['categoryName']}', style: const TextStyle(fontSize: 11)),
                                    trailing: Text('₦${s['averageAmount']}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                  )),
                            ],
                          ),
                        ),
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, _) => Text('Error: $err'),
                  ),

                  const SizedBox(height: 24),

                  // SECTION 4: 30-DAY CASH FLOW FORECAST
                  Text('30-Day Cash Flow Forecast', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  forecastAsync.when(
                    data: (points) {
                      if (points.isEmpty) return const SizedBox.shrink();

                      final spots = <FlSpot>[];
                      for (int i = 0; i < points.length; i++) {
                        final val = (points[i]['projectedBalance'] as num? ?? 0).toDouble();
                        spots.add(FlSpot(i.toDouble(), val));
                      }

                      return Card(
                        child: Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Projected Balance Trajectory (Next 30 Days)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 16),
                              SizedBox(
                                height: 200,
                                child: LineChart(
                                  LineChartData(
                                    gridData: const FlGridData(show: true),
                                    titlesData: const FlTitlesData(show: false),
                                    borderData: FlBorderData(show: true),
                                    lineBarsData: [
                                      LineChartBarData(
                                        spots: spots,
                                        isCurved: true,
                                        color: Colors.teal,
                                        barWidth: 3,
                                        belowBarData: BarAreaData(
                                          show: true,
                                          color: Colors.teal.withValues(alpha: 0.2),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, _) => Text('Error: $err'),
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

class TimeSeriesPoint {
  final String label;
  final double inflow;
  final double outflow;

  const TimeSeriesPoint({
    required this.label,
    required this.inflow,
    required this.outflow,
  });

  factory TimeSeriesPoint.fromJson(Map<String, dynamic> json) {
    return TimeSeriesPoint(
      label: json['label'] as String,
      inflow: (json['inflow'] is num) ? (json['inflow'] as num).toDouble() : double.parse(json['inflow'].toString()),
      outflow: (json['outflow'] is num) ? (json['outflow'] as num).toDouble() : double.parse(json['outflow'].toString()),
    );
  }
}

class CashFlowReport {
  final String period;
  final double totalInflow;
  final double totalOutflow;
  final double netCashFlow;
  final List<TimeSeriesPoint> timeSeries;

  const CashFlowReport({
    required this.period,
    required this.totalInflow,
    required this.totalOutflow,
    required this.netCashFlow,
    required this.timeSeries,
  });

  factory CashFlowReport.fromJson(Map<String, dynamic> json) {
    final rawList = json['timeSeries'] as List? ?? [];
    return CashFlowReport(
      period: (json['period'] as String?) ?? 'THIS_MONTH',
      totalInflow: (json['totalInflow'] is num) ? (json['totalInflow'] as num).toDouble() : double.parse(json['totalInflow'].toString()),
      totalOutflow: (json['totalOutflow'] is num) ? (json['totalOutflow'] as num).toDouble() : double.parse(json['totalOutflow'].toString()),
      netCashFlow: (json['netCashFlow'] is num) ? (json['netCashFlow'] as num).toDouble() : double.parse(json['netCashFlow'].toString()),
      timeSeries: rawList.map((e) => TimeSeriesPoint.fromJson(e)).toList(),
    );
  }
}

class CategorySpendingItem {
  final String id;
  final String name;
  final String icon;
  final String color;
  final double amount;
  final int count;
  final double percentage;

  const CategorySpendingItem({
    required this.id,
    required this.name,
    required this.icon,
    required this.color,
    required this.amount,
    required this.count,
    required this.percentage,
  });

  factory CategorySpendingItem.fromJson(Map<String, dynamic> json) {
    return CategorySpendingItem(
      id: json['id'] as String,
      name: json['name'] as String,
      icon: (json['icon'] as String?) ?? 'category',
      color: (json['color'] as String?) ?? '#0F62FE',
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : double.parse(json['amount'].toString()),
      count: (json['count'] as int?) ?? 0,
      percentage: (json['percentage'] is num) ? (json['percentage'] as num).toDouble() : double.parse(json['percentage'].toString()),
    );
  }
}

class CategoryBreakdownReport {
  final String type;
  final double grandTotal;
  final List<CategorySpendingItem> items;

  const CategoryBreakdownReport({
    required this.type,
    required this.grandTotal,
    required this.items,
  });

  factory CategoryBreakdownReport.fromJson(Map<String, dynamic> json) {
    final rawList = json['items'] as List? ?? [];
    return CategoryBreakdownReport(
      type: (json['type'] as String?) ?? 'EXPENSE',
      grandTotal: (json['grandTotal'] is num) ? (json['grandTotal'] as num).toDouble() : double.parse(json['grandTotal'].toString()),
      items: rawList.map((e) => CategorySpendingItem.fromJson(e)).toList(),
    );
  }
}

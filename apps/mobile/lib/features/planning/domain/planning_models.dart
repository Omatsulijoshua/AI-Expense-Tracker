class CategoryAllocation {
  final String categoryId;
  final String categoryName;
  final double allocated;
  final double spent;
  final double percentage;

  const CategoryAllocation({
    required this.categoryId,
    required this.categoryName,
    required this.allocated,
    required this.spent,
    required this.percentage,
  });

  factory CategoryAllocation.fromJson(Map<String, dynamic> json) {
    return CategoryAllocation(
      categoryId: json['categoryId'] as String,
      categoryName: json['categoryName'] as String,
      allocated: (json['allocated'] is num) ? (json['allocated'] as num).toDouble() : double.parse(json['allocated'].toString()),
      spent: (json['spent'] is num) ? (json['spent'] as num).toDouble() : double.parse(json['spent'].toString()),
      percentage: (json['percentage'] is num) ? (json['percentage'] as num).toDouble() : double.parse(json['percentage'].toString()),
    );
  }
}

class BudgetModel {
  final String budgetId;
  final String name;
  final double totalAllocated;
  final double totalSpent;
  final double overallPercentage;
  final List<CategoryAllocation> categoryAllocations;

  const BudgetModel({
    required this.budgetId,
    required this.name,
    required this.totalAllocated,
    required this.totalSpent,
    required this.overallPercentage,
    required this.categoryAllocations,
  });

  factory BudgetModel.fromJson(Map<String, dynamic> json) {
    final rawCats = json['categoryAllocations'] as List? ?? [];
    return BudgetModel(
      budgetId: json['budgetId'] as String,
      name: json['name'] as String,
      totalAllocated: (json['totalAllocated'] is num) ? (json['totalAllocated'] as num).toDouble() : double.parse(json['totalAllocated'].toString()),
      totalSpent: (json['totalSpent'] is num) ? (json['totalSpent'] as num).toDouble() : double.parse(json['totalSpent'].toString()),
      overallPercentage: (json['overallPercentage'] is num) ? (json['overallPercentage'] as num).toDouble() : double.parse(json['overallPercentage'].toString()),
      categoryAllocations: rawCats.map((e) => CategoryAllocation.fromJson(e)).toList(),
    );
  }
}

class BillModel {
  final String id;
  final String name;
  final double amount;
  final DateTime dueDate;
  final String status;
  final String frequency;

  const BillModel({
    required this.id,
    required this.name,
    required this.amount,
    required this.dueDate,
    required this.status,
    required this.frequency,
  });

  factory BillModel.fromJson(Map<String, dynamic> json) {
    return BillModel(
      id: json['id'] as String,
      name: json['name'] as String,
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : double.parse(json['amount'].toString()),
      dueDate: DateTime.parse(json['dueDate'] as String),
      status: json['status'] as String,
      frequency: (json['frequency'] as String?) ?? 'MONTHLY',
    );
  }
}

class SavingsGoalModel {
  final String id;
  final String name;
  final double targetAmount;
  final double currentAmount;
  final double percentage;
  final bool isCompleted;

  const SavingsGoalModel({
    required this.id,
    required this.name,
    required this.targetAmount,
    required this.currentAmount,
    required this.percentage,
    required this.isCompleted,
  });

  factory SavingsGoalModel.fromJson(Map<String, dynamic> json) {
    return SavingsGoalModel(
      id: json['id'] as String,
      name: json['name'] as String,
      targetAmount: (json['targetAmount'] is num) ? (json['targetAmount'] as num).toDouble() : double.parse(json['targetAmount'].toString()),
      currentAmount: (json['currentAmount'] is num) ? (json['currentAmount'] as num).toDouble() : double.parse(json['currentAmount'].toString()),
      percentage: (json['percentage'] is num) ? (json['percentage'] as num).toDouble() : double.parse(json['percentage'].toString()),
      isCompleted: (json['isCompleted'] as bool?) ?? false,
    );
  }
}

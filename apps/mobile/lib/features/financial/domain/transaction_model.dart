class CategoryModel {
  final String id;
  final String name;
  final String type;
  final String icon;
  final String color;

  const CategoryModel({
    required this.id,
    required this.name,
    required this.type,
    required this.icon,
    required this.color,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      icon: (json['icon'] as String?) ?? 'category',
      color: (json['color'] as String?) ?? '#0F62FE',
    );
  }
}

class TransactionModel {
  final String id;
  final String accountId;
  final String type;
  final double amount;
  final String currency;
  final String? merchant;
  final String? description;
  final DateTime transactionDate;
  final String? categoryName;
  final String? categoryIcon;
  final String? categoryColor;
  final String? accountName;

  const TransactionModel({
    required this.id,
    required this.accountId,
    required this.type,
    required this.amount,
    required this.currency,
    this.merchant,
    this.description,
    required this.transactionDate,
    this.categoryName,
    this.categoryIcon,
    this.categoryColor,
    this.accountName,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    return TransactionModel(
      id: json['id'] as String,
      accountId: json['accountId'] as String,
      type: json['type'] as String,
      amount: (json['amount'] is num) ? (json['amount'] as num).toDouble() : double.parse(json['amount'].toString()),
      currency: (json['currency'] as String?) ?? 'NGN',
      merchant: json['merchant'] as String?,
      description: json['description'] as String?,
      transactionDate: DateTime.parse(json['transactionDate'] as String),
      categoryName: json['category']?['name'] as String?,
      categoryIcon: json['category']?['icon'] as String?,
      categoryColor: json['category']?['color'] as String?,
      accountName: json['account']?['name'] as String?,
    );
  }
}

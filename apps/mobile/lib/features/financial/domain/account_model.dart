class AccountModel {
  final String id;
  final String name;
  final String type;
  final String? institution;
  final String currency;
  final double currentBalance;
  final double availableBalance;

  const AccountModel({
    required this.id,
    required this.name,
    required this.type,
    this.institution,
    required this.currency,
    required this.currentBalance,
    required this.availableBalance,
  });

  factory AccountModel.fromJson(Map<String, dynamic> json) {
    return AccountModel(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      institution: json['institution'] as String?,
      currency: (json['currency'] as String?) ?? 'NGN',
      currentBalance: (json['currentBalance'] is num) ? (json['currentBalance'] as num).toDouble() : double.parse(json['currentBalance'].toString()),
      availableBalance: (json['availableBalance'] is num) ? (json['availableBalance'] as num).toDouble() : double.parse(json['availableBalance'].toString()),
    );
  }
}

class AccountsOverview {
  final double netWorth;
  final int count;
  final List<AccountModel> accounts;

  const AccountsOverview({
    required this.netWorth,
    required this.count,
    required this.accounts,
  });

  factory AccountsOverview.fromJson(Map<String, dynamic> json) {
    final rawList = json['accounts'] as List? ?? [];
    return AccountsOverview(
      netWorth: (json['netWorth'] is num) ? (json['netWorth'] as num).toDouble() : double.parse(json['netWorth'].toString()),
      count: (json['count'] as int?) ?? 0,
      accounts: rawList.map((e) => AccountModel.fromJson(e)).toList(),
    );
  }
}

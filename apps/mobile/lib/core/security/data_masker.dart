/// Security utility for masking sensitive financial data before UI presentation.
class DataMasker {
  /// Mask credit or debit card numbers, leaving only last 4 digits visible.
  static String maskCardNumber(String cardNumber) {
    final clean = cardNumber.replaceAll(RegExp(r'\s+'), '');
    if (clean.length < 4) return '****';
    final last4 = clean.substring(clean.length - 4);
    return '**** **** **** $last4';
  }

  /// Mask bank account numbers, leaving only last 4 digits.
  static String maskAccountNumber(String accountNumber) {
    final clean = accountNumber.replaceAll(RegExp(r'\s+'), '');
    if (clean.length <= 4) return clean;
    final last4 = clean.substring(clean.length - 4);
    return '****$last4';
  }

  /// Mask email address for privacy (e.g., j***a@domain.com).
  static String maskEmail(String email) {
    if (!email.contains('@')) return email;
    final parts = email.split('@');
    final name = parts[0];
    final domain = parts[1];

    if (name.length <= 2) {
      return '${name[0]}*@$domain';
    }
    final first = name[0];
    final last = name[name.length - 1];
    return '$first***$last@$domain';
  }
}

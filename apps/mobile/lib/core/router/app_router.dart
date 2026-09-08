import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/dashboard/presentation/dashboard_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/financial/presentation/screens/accounts_screen.dart';
import '../../features/financial/presentation/screens/add_transaction_screen.dart';
import '../../features/financial/presentation/screens/transactions_timeline_screen.dart';
import '../../features/analytics/presentation/screens/analytics_screen.dart';
import '../../features/analytics/presentation/screens/transaction_search_screen.dart';
import '../../features/planning/presentation/screens/budgets_screen.dart';
import '../../features/planning/presentation/screens/bills_screen.dart';
import '../../features/planning/presentation/screens/goals_screen.dart';
import '../../features/import/presentation/screens/import_screen.dart';
import '../../features/integrations/presentation/screens/bank_connections_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const DashboardScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/register',
      builder: (context, state) => const RegisterScreen(),
    ),
    GoRoute(
      path: '/accounts',
      builder: (context, state) => const AccountsScreen(),
    ),
    GoRoute(
      path: '/add-transaction',
      builder: (context, state) => const AddTransactionScreen(),
    ),
    GoRoute(
      path: '/timeline',
      builder: (context, state) => const TransactionsTimelineScreen(),
    ),
    GoRoute(
      path: '/analytics',
      builder: (context, state) => const AnalyticsScreen(),
    ),
    GoRoute(
      path: '/search',
      builder: (context, state) => const TransactionSearchScreen(),
    ),
    GoRoute(
      path: '/budgets',
      builder: (context, state) => const BudgetsScreen(),
    ),
    GoRoute(
      path: '/bills',
      builder: (context, state) => const BillsScreen(),
    ),
    GoRoute(
      path: '/goals',
      builder: (context, state) => const GoalsScreen(),
    ),
    GoRoute(
      path: '/import',
      builder: (context, state) => const ImportScreen(),
    ),
    GoRoute(
      path: '/integrations',
      builder: (context, state) => const BankConnectionsScreen(),
    ),
  ],
);

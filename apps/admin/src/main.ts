interface UserRecord {
  id: string;
  name: string;
  email: string;
  currency: string;
  isLocked: boolean;
  accountsCount: number;
  transactionsCount: number;
  createdAt: string;
}

interface ProviderHealth {
  name: string;
  status: 'ONLINE' | 'OFFLINE' | 'SANDBOX';
  latencyMs: number;
  lastSyncAt: string;
}

interface AiBreakdown {
  feature: string;
  usageCount: number;
  estimatedTokens: number;
  estimatedCostUsd: number;
}

interface AuditLog {
  id: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: string;
  createdAt: string;
}

// Mock State for Admin Frontend Console
const state = {
  activeTab: 'overview',
  users: [
    { id: 'usr-101', name: 'Joshua Omatsuli', email: 'joshua@expensetracker.ai', currency: 'NGN', isLocked: false, accountsCount: 4, transactionsCount: 128, createdAt: '2026-01-15' },
    { id: 'usr-102', name: 'Sarah Connor', email: 'sarah@skynet.org', currency: 'USD', isLocked: false, accountsCount: 2, transactionsCount: 45, createdAt: '2026-02-01' },
    { id: 'usr-103', name: 'Alex Rivera', email: 'alex@finance.co', currency: 'EUR', isLocked: true, accountsCount: 1, transactionsCount: 12, createdAt: '2026-02-20' },
    { id: 'usr-104', name: 'Nkechi Amadi', email: 'nkechi@business.ng', currency: 'NGN', isLocked: false, accountsCount: 5, transactionsCount: 210, createdAt: '2026-03-01' }
  ] as UserRecord[],
  providers: [
    { name: 'Mono Banking Adapter (Nigeria)', status: 'SANDBOX', latencyMs: 42, lastSyncAt: 'Just now' },
    { name: 'Plaid Open Banking Adapter (Global)', status: 'SANDBOX', latencyMs: 65, lastSyncAt: 'Just now' },
    { name: 'Mock Direct API Sandbox Adapter', status: 'ONLINE', latencyMs: 12, lastSyncAt: 'Just now' },
    { name: 'Redis Queue & Cache Worker', status: 'ONLINE', latencyMs: 3, lastSyncAt: 'Just now' },
    { name: 'PostgreSQL Prisma Database', status: 'ONLINE', latencyMs: 5, lastSyncAt: 'Just now' }
  ] as ProviderHealth[],
  aiMetrics: {
    totalScans: 48,
    totalVoiceParses: 32,
    totalAssistantQueries: 115,
    totalTokens: 245300,
    estimatedCostUsd: 0.4906,
    breakdown: [
      { feature: 'Receipt Vision OCR', usageCount: 48, estimatedTokens: 45600, estimatedCostUsd: 0.0912 },
      { feature: 'Voice Transaction Parser', usageCount: 32, estimatedTokens: 13440, estimatedCostUsd: 0.0269 },
      { feature: 'Conversational AI Advisor', usageCount: 115, estimatedTokens: 186260, estimatedCostUsd: 0.3725 }
    ] as AiBreakdown[]
  },
  auditLogs: [
    { id: 'log-901', actorEmail: 'joshua@expensetracker.ai', action: 'RECEIPT_OCR_SCAN', entity: 'DOCUMENT', entityId: 'doc-881', metadata: '{"merchant":"Uber", "amount":4500}', createdAt: '2026-09-08 15:40:12' },
    { id: 'log-902', actorEmail: 'sarah@skynet.org', action: 'BANK_ACCOUNT_SYNC', entity: 'ACCOUNT', entityId: 'acc-302', metadata: '{"provider":"Plaid", "status":"SUCCESS"}', createdAt: '2026-09-08 15:35:00' },
    { id: 'log-903', actorEmail: 'SYSTEM', action: 'ANOMALY_ALERT_TRIGGERED', entity: 'TRANSACTION', entityId: 'tx-551', metadata: '{"multiplier":3.2, "amount":250000}', createdAt: '2026-09-08 15:10:45' },
    { id: 'log-904', actorEmail: 'joshua@expensetracker.ai', action: 'VOICE_TRANSACTION_CREATE', entity: 'TRANSACTION', entityId: 'tx-602', metadata: '{"confidence":0.98, "rawText":"Spent 12000 NGN for Fuel"}', createdAt: '2026-09-08 14:55:00' },
    { id: 'log-905', actorEmail: 'ADMIN_SYSTEM', action: 'UPDATE_USER_STATUS', entity: 'USER', entityId: 'usr-103', metadata: '{"isLocked":true}', createdAt: '2026-09-08 12:00:00' }
  ] as AuditLog[]
};

function renderApp() {
  const container = document.getElementById('app');
  if (!container) return;

  const totalUsers = state.users.length;
  const lockedUsers = state.users.filter(u => u.isLocked).length;

  container.innerHTML = `
    <!-- STATS SUMMARY CARDS -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Platform Active Users</div>
        <div class="stat-value">${totalUsers}</div>
        <div class="stat-subtitle">${lockedUsers} Accounts Locked</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Banking Integration Adapters</div>
        <div class="stat-value">${state.providers.length} Active</div>
        <div class="stat-subtitle">Mono & Plaid Sandbox Online</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total AI Tokens Consumed</div>
        <div class="stat-value">${state.aiMetrics.totalTokens.toLocaleString()}</div>
        <div class="stat-subtitle">OCR, Voice & Assistant</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Estimated AI Cost (USD)</div>
        <div class="stat-value">$${state.aiMetrics.estimatedCostUsd.toFixed(4)}</div>
        <div class="stat-subtitle">$0.002 / 1k Tokens</div>
      </div>
    </div>

    <!-- TAB 1: SYSTEM OVERVIEW -->
    <div class="tab-content ${state.activeTab === 'overview' ? 'active' : ''}">
      <div class="card-panel">
        <div class="card-title">
          <span>System Infrastructure Operational Status</span>
          <span class="status-badge operational">All Systems Green</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Service / Subsystem</th>
              <th>Status</th>
              <th>Latency</th>
              <th>Last Checked</th>
            </tr>
          </thead>
          <tbody>
            ${state.providers.map(p => `
              <tr>
                <td><strong>${p.name}</strong></td>
                <td><span class="btn ${p.status === 'ONLINE' ? 'btn-success' : 'btn-action'}">${p.status}</span></td>
                <td>${p.latencyMs} ms</td>
                <td>${p.lastSyncAt}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 2: USER MANAGEMENT -->
    <div class="tab-content ${state.activeTab === 'users' ? 'active' : ''}">
      <div class="card-panel">
        <div class="card-title">
          <span>User Accounts Management</span>
          <input type="text" class="search-bar" placeholder="Search user name or email..." oninput="handleUserSearch(this.value)">
        </div>
        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Currency</th>
              <th>Accounts</th>
              <th>Transactions</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${state.users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td>${u.currency}</td>
                <td>${u.accountsCount}</td>
                <td>${u.transactionsCount}</td>
                <td>
                  <span class="btn ${u.isLocked ? 'btn-danger' : 'btn-success'}">
                    ${u.isLocked ? 'LOCKED' : 'ACTIVE'}
                  </span>
                </td>
                <td>
                  <button class="btn btn-action" onclick="toggleUserLock('${u.id}')">
                    ${u.isLocked ? 'Unlock User' : 'Lock User'}
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 3: PROVIDER HEALTH -->
    <div class="tab-content ${state.activeTab === 'providers' ? 'active' : ''}">
      <div class="card-panel">
        <div class="card-title">Open Banking & API Providers Diagnostics</div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
          ${state.providers.map(p => `
            <div style="background: var(--bg-primary); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
              <h4 style="color: var(--accent-blue); margin-bottom: 8px;">${p.name}</h4>
              <p style="font-size: 0.9rem; color: var(--text-muted);">Status: <strong style="color: var(--text-main);">${p.status}</strong></p>
              <p style="font-size: 0.9rem; color: var(--text-muted);">Response Time: <strong style="color: var(--text-main);">${p.latencyMs} ms</strong></p>
              <p style="font-size: 0.8rem; color: var(--accent-green); margin-top: 8px;">✓ Endpoints Responding (HTTP 200)</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- TAB 4: AI METRICS -->
    <div class="tab-content ${state.activeTab === 'ai-metrics' ? 'active' : ''}">
      <div class="card-panel">
        <div class="card-title">AI Token Usage & API Cost Metrics</div>
        <table>
          <thead>
            <tr>
              <th>AI Model Feature</th>
              <th>Invocations Count</th>
              <th>Estimated Tokens Consumed</th>
              <th>Estimated API Cost (USD)</th>
            </tr>
          </thead>
          <tbody>
            ${state.aiMetrics.breakdown.map(b => `
              <tr>
                <td><strong>${b.feature}</strong></td>
                <td>${b.usageCount} calls</td>
                <td>${b.estimatedTokens.toLocaleString()} tokens</td>
                <td>$${b.estimatedCostUsd.toFixed(4)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- TAB 5: AUDIT LOGS -->
    <div class="tab-content ${state.activeTab === 'audit-logs' ? 'active' : ''}">
      <div class="card-panel">
        <div class="card-title">Platform Audit Trail</div>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Entity ID</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            ${state.auditLogs.map(l => `
              <tr>
                <td>${l.createdAt}</td>
                <td><strong>${l.actorEmail}</strong></td>
                <td><span style="color: var(--accent-blue); font-weight: 600;">${l.action}</span></td>
                <td>${l.entity}</td>
                <td><code>${l.entityId}</code></td>
                <td><div class="json-viewer">${l.metadata}</div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Global Handlers
(window as any).switchTab = (tabName: string) => {
  state.activeTab = tabName;
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const activeNav = Array.from(document.querySelectorAll('.nav-item')).find(el => el.textContent?.toLowerCase().includes(tabName.replace('-', ' ')));
  if (activeNav) activeNav.classList.add('active');

  const titleMap: Record<string, string> = {
    overview: 'System Infrastructure Overview',
    users: 'Platform User Management',
    providers: 'Financial Provider Diagnostics',
    'ai-metrics': 'AI Token & API Cost Analytics',
    'audit-logs': 'System Activity Audit Trail'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titleMap[tabName] || 'Admin Console';

  renderApp();
};

(window as any).toggleUserLock = (userId: string) => {
  const user = state.users.find(u => u.id === userId);
  if (user) {
    user.isLocked = !user.isLocked;
    state.auditLogs.unshift({
      id: `log-${Date.now()}`,
      actorEmail: 'ADMIN_SYSTEM',
      action: user.isLocked ? 'LOCK_USER_ACCOUNT' : 'UNLOCK_USER_ACCOUNT',
      entity: 'USER',
      entityId: user.id,
      metadata: JSON.stringify({ isLocked: user.isLocked }),
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    });
    renderApp();
  }
};

(window as any).handleUserSearch = (query: string) => {
  // Client-side filtering visual
  renderApp();
};

// Initial Render
document.addEventListener('DOMContentLoaded', () => {
  renderApp();
});

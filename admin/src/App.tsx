import { useCallback, useEffect, useMemo, useState } from 'react';

type OverviewStats = {
  totalGames: number;
  gamesWithResult: number;
  gamesWithoutResult: number;
  totalRegisteredUsers: number;
};

type AdminUser = {
  id: string;
  login: string;
  email: string;
  name: string | null;
  avatar: string;
  emailVerified: boolean;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type ApiFailure = {
  success: false;
  error: string;
};

// const API_BASE_URL = '/api'; // локально
const API_BASE_URL = '/api/api'; // прод
const ADMIN_HEADER_NAME = 'x-admin-secret';
const ADMIN_HEADER_VALUE = import.meta.env.VITE_ADMIN_API_KEY || 'local-chesson-admin-secret';

async function adminRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      [ADMIN_HEADER_NAME]: ADMIN_HEADER_VALUE,
      'Content-Type': 'application/json',
      ...(init?.headers || {})
    }
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const rawText = await response.text();
    throw new Error(rawText || 'Non-JSON response from API');
  }

  const payload = (await response.json()) as T | ApiFailure;

  if (!response.ok || ('success' in payload && payload.success === false)) {
    throw new Error('error' in payload ? payload.error : 'Request failed');
  }

  return payload as T;
}

function App() {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'blocked' | 'active'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [page, setPage] = useState(1);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const data = await adminRequest<{ success: true; stats: OverviewStats }>('/admin/stats/overview');
      setOverview(data.stats);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        blocked: blockedFilter,
        verified: verifiedFilter
      });

      if (search.trim()) {
        params.set('search', search.trim());
      }

      const data = await adminRequest<{
        success: true;
        users: AdminUser[];
        pagination: Pagination;
      }>(`/admin/users?${params.toString()}`);

      setUsers(data.users);
      setUsersPagination(data.pagination);
    } finally {
      setLoadingUsers(false);
    }
  }, [blockedFilter, page, search, verifiedFilter]);

  const refreshAll = useCallback(async () => {
    setError(null);
    try {
      await Promise.all([loadStats(), loadUsers()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [loadStats, loadUsers]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setPage(1);
  }, [search, blockedFilter, verifiedFilter]);

  const executeUserAction = useCallback(
    async (userId: string, runner: () => Promise<void>) => {
      setActionUserId(userId);
      setError(null);
      try {
        await runner();
        await Promise.all([loadUsers(), loadStats()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setActionUserId(null);
      }
    },
    [loadStats, loadUsers]
  );

  const handleBlock = useCallback(
    async (user: AdminUser) => {
      const reason = window.prompt('Reason for blocking (optional):', user.blockedReason || '');
      await executeUserAction(user.id, async () => {
        await adminRequest(`/admin/users/${user.id}/block`, {
          method: 'PATCH',
          body: JSON.stringify({ reason: reason || undefined })
        });
      });
    },
    [executeUserAction]
  );

  const handleUnblock = useCallback(
    async (user: AdminUser) => {
      await executeUserAction(user.id, async () => {
        await adminRequest(`/admin/users/${user.id}/unblock`, { method: 'PATCH' });
      });
    },
    [executeUserAction]
  );

  const handleDelete = useCallback(
    async (user: AdminUser) => {
      const confirmed = window.confirm(`Delete user ${user.login}? This action cannot be undone.`);
      if (!confirmed) {
        return;
      }

      await executeUserAction(user.id, async () => {
        await adminRequest(`/admin/users/${user.id}`, { method: 'DELETE' });
      });
    },
    [executeUserAction]
  );

  const handleResendVerification = useCallback(
    async (user: AdminUser) => {
      await executeUserAction(user.id, async () => {
        await adminRequest(`/admin/users/${user.id}/resend-verification`, { method: 'PATCH' });
      });
    },
    [executeUserAction]
  );

  const handleEdit = useCallback(
    async (user: AdminUser) => {
      const nameValue = window.prompt('Name:', user.name || '');
      if (nameValue === null) {
        return;
      }

      const avatarValue = window.prompt('Avatar index/string:', user.avatar || '0');
      if (avatarValue === null) {
        return;
      }

      const verifiedValue = window.confirm('Email should be marked as verified? (OK = verified, Cancel = unverified)');

      await executeUserAction(user.id, async () => {
        await adminRequest(`/admin/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: nameValue,
            avatar: avatarValue,
            emailVerified: verifiedValue
          })
        });
      });
    },
    [executeUserAction]
  );

  const generatedAt = useMemo(
    () => new Date().toLocaleString(),
    [overview, usersPagination, users, loadingStats, loadingUsers]
  );

  const canGoPrev = (usersPagination?.page || 1) > 1;
  const canGoNext = (usersPagination?.page || 1) < (usersPagination?.totalPages || 1);

  return (
    <div className="page">
      <div className="bg-shape bg-shape-left" />
      <div className="bg-shape bg-shape-right" />

      <main className="panel">
        <header className="header">
          <div>
            <p className="kicker">Chesson Internal</p>
            <h1>Admin Dashboard</h1>
            <p className="hint">Users management + platform statistics</p>
          </div>
          <button className="refresh-btn" onClick={() => void refreshAll()} disabled={loadingStats || loadingUsers}>
            {loadingStats || loadingUsers ? 'Refreshing...' : 'Refresh All'}
          </button>
        </header>

        {error && <div className="error-box">Request error: {error}</div>}

        <section className="cards-grid">
          <article className="stat-card">
            <p>Total games</p>
            <h2>{overview?.totalGames ?? '-'}</h2>
          </article>
          <article className="stat-card">
            <p>Games without result</p>
            <h2>{overview?.gamesWithoutResult ?? '-'}</h2>
          </article>
          <article className="stat-card">
            <p>Games with result</p>
            <h2>{overview?.gamesWithResult ?? '-'}</h2>
          </article>
          <article className="stat-card">
            <p>Registered users</p>
            <h2>{overview?.totalRegisteredUsers ?? '-'}</h2>
          </article>
        </section>

        <section className="users-section">
          <div className="users-toolbar">
            <h3>Users</h3>
            <div className="toolbar-controls">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by login/email/name"
              />
              <button
                className="btn"
                onClick={() => {
                  setSearch(searchInput);
                  setPage(1);
                }}
              >
                Search
              </button>
              <select value={blockedFilter} onChange={(e) => setBlockedFilter(e.target.value as typeof blockedFilter)}>
                <option value="all">All users</option>
                <option value="active">Only active</option>
                <option value="blocked">Only blocked</option>
              </select>
              <select value={verifiedFilter} onChange={(e) => setVerifiedFilter(e.target.value as typeof verifiedFilter)}>
                <option value="all">All emails</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Login</th>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan={7} className="empty">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.login}</td>
                      <td>{user.email}</td>
                      <td>{user.name || '-'}</td>
                      <td>
                        <span className={user.isBlocked ? 'pill blocked' : 'pill active'}>
                          {user.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <span className={user.emailVerified ? 'pill verified' : 'pill unverified'}>
                          {user.emailVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn"
                            onClick={() => void handleEdit(user)}
                            disabled={actionUserId === user.id}
                          >
                            Edit
                          </button>
                          {!user.emailVerified && (
                            <button
                              className="btn"
                              onClick={() => void handleResendVerification(user)}
                              disabled={actionUserId === user.id}
                            >
                              Resend verification
                            </button>
                          )}
                          {user.isBlocked ? (
                            <button
                              className="btn success"
                              onClick={() => void handleUnblock(user)}
                              disabled={actionUserId === user.id}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              className="btn warning"
                              onClick={() => void handleBlock(user)}
                              disabled={actionUserId === user.id}
                            >
                              Block
                            </button>
                          )}
                          <button
                            className="btn danger"
                            onClick={() => void handleDelete(user)}
                            disabled={actionUserId === user.id}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-row">
            <span>
              Page {usersPagination?.page || 1} / {usersPagination?.totalPages || 1} | Total users: {usersPagination?.total || 0}
            </span>
            <div className="actions">
              <button className="btn" disabled={!canGoPrev || loadingUsers} onClick={() => setPage((p) => p - 1)}>
                Prev
              </button>
              <button className="btn" disabled={!canGoNext || loadingUsers} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        </section>

        <footer className="footer-row">
          <span>API base: {API_BASE_URL}</span>
          <span>Updated: {generatedAt}</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

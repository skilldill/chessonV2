import { useCallback, useEffect, useMemo, useState } from 'react';

type OverviewStats = {
  totalGames: number;
  gamesWithResult: number;
  gamesWithoutResult: number;
  totalRegisteredUsers: number;
  totalGameAnalyses: number;
  uniqueAnalysisViewers: number;
};

type AdminUser = {
  id: string;
  login: string;
  email: string;
  name: string | null;
  avatar: string;
  gamesPlayed: number;
  emailVerified: boolean;
  isBlocked: boolean;
  blockedReason: string | null;
  blockedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminAnalysis = {
  id: string;
  gameId: string;
  status: 'running' | 'done' | 'failed';
  progressCurrent: number;
  progressTotal: number;
  startedAt: string;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  error: string | null;
  bestMoveText: string | null;
  keyMomentPly: number | null;
};

type AdminPuzzle = {
  id: string;
  sourceGameId: string;
  sourcePly: number;
  sideToMove: 'white' | 'black';
  solutionLength: number;
  difficulty: 'easy' | 'medium' | 'hard';
  themes: string[];
  status: 'draft' | 'published' | 'rejected';
  likesCount: number;
  dislikesCount: number;
  isBlocked: boolean;
  blockedAt: string | null;
  blockedReason: string | null;
  createdAt: string;
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
const GAME_BASE_URL = import.meta.env.VITE_ADMIN_GAME_BASE_URL || 'https://game.chesson.me';
const ADMIN_HEADER_NAME = 'x-admin-secret';
const ADMIN_HEADER_VALUE = import.meta.env.VITE_ADMIN_API_KEY || 'local-chesson-admin-secret';

async function adminRequest<T extends object>(path: string, init?: RequestInit): Promise<T> {
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
  const [activeTab, setActiveTab] = useState<'overview' | 'puzzles' | 'users'>('overview');
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [analyses, setAnalyses] = useState<AdminAnalysis[]>([]);
  const [puzzles, setPuzzles] = useState<AdminPuzzle[]>([]);
  const [usersPagination, setUsersPagination] = useState<Pagination | null>(null);
  const [puzzlesPagination, setPuzzlesPagination] = useState<Pagination | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [loadingPuzzles, setLoadingPuzzles] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [actionPuzzleId, setActionPuzzleId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [blockedFilter, setBlockedFilter] = useState<'all' | 'blocked' | 'active'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [page, setPage] = useState(1);
  const [puzzlesPage, setPuzzlesPage] = useState(1);
  const [puzzleStatusFilter, setPuzzleStatusFilter] = useState<'all' | 'draft' | 'published' | 'rejected'>('all');
  const [puzzleBlockedFilter, setPuzzleBlockedFilter] = useState<'all' | 'active' | 'blocked'>('all');

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

  const loadAnalyses = useCallback(async () => {
    setLoadingAnalyses(true);
    try {
      const data = await adminRequest<{ success: true; analyses: AdminAnalysis[] }>('/admin/analyses?limit=30');
      setAnalyses(data.analyses);
    } finally {
      setLoadingAnalyses(false);
    }
  }, []);

  const loadPuzzles = useCallback(async () => {
    setLoadingPuzzles(true);
    try {
      const params = new URLSearchParams({
        page: String(puzzlesPage),
        limit: '50',
        status: puzzleStatusFilter,
        blocked: puzzleBlockedFilter,
      });

      const data = await adminRequest<{
        success: true;
        puzzles: AdminPuzzle[];
        pagination: Pagination;
      }>(`/admin/puzzles?${params.toString()}`);

      setPuzzles(data.puzzles);
      setPuzzlesPagination(data.pagination);
    } finally {
      setLoadingPuzzles(false);
    }
  }, [puzzleBlockedFilter, puzzleStatusFilter, puzzlesPage]);

  const refreshAll = useCallback(async () => {
    setError(null);
    try {
      await Promise.all([loadStats(), loadUsers(), loadAnalyses(), loadPuzzles()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [loadAnalyses, loadPuzzles, loadStats, loadUsers]);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    setPage(1);
  }, [search, blockedFilter, verifiedFilter]);

  useEffect(() => {
    setPuzzlesPage(1);
  }, [puzzleBlockedFilter, puzzleStatusFilter]);

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

  const executePuzzleAction = useCallback(
    async (puzzleId: string, runner: () => Promise<void>) => {
      setActionPuzzleId(puzzleId);
      setError(null);
      try {
        await runner();
        await loadPuzzles();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setActionPuzzleId(null);
      }
    },
    [loadPuzzles]
  );

  const handleBlockPuzzle = useCallback(
    async (puzzle: AdminPuzzle) => {
      const reason = window.prompt('Reason for blocking (optional):', puzzle.blockedReason || '');
      await executePuzzleAction(puzzle.id, async () => {
        await adminRequest(`/admin/puzzles/${puzzle.id}/block`, {
          method: 'PATCH',
          body: JSON.stringify({ reason: reason || undefined }),
        });
      });
    },
    [executePuzzleAction]
  );

  const handleUnblockPuzzle = useCallback(
    async (puzzle: AdminPuzzle) => {
      await executePuzzleAction(puzzle.id, async () => {
        await adminRequest(`/admin/puzzles/${puzzle.id}/unblock`, { method: 'PATCH' });
      });
    },
    [executePuzzleAction]
  );

  const generatedAt = useMemo(
    () => new Date().toLocaleString(),
    [overview, usersPagination, puzzlesPagination, users, analyses, puzzles, loadingStats, loadingUsers, loadingAnalyses, loadingPuzzles]
  );

  const canGoPrev = (usersPagination?.page || 1) > 1;
  const canGoNext = (usersPagination?.page || 1) < (usersPagination?.totalPages || 1);
  const canGoPuzzlesPrev = (puzzlesPagination?.page || 1) > 1;
  const canGoPuzzlesNext = (puzzlesPagination?.page || 1) < (puzzlesPagination?.totalPages || 1);

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
          <button className="refresh-btn" onClick={() => void refreshAll()} disabled={loadingStats || loadingUsers || loadingAnalyses}>
            {loadingStats || loadingUsers || loadingAnalyses || loadingPuzzles ? 'Refreshing...' : 'Refresh All'}
          </button>
        </header>

        {error && <div className="error-box">Request error: {error}</div>}

        <nav className="tabbar" aria-label="Admin sections">
          <button className={activeTab === 'overview' ? 'tab active' : 'tab'} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={activeTab === 'puzzles' ? 'tab active' : 'tab'} onClick={() => setActiveTab('puzzles')}>
            Puzzles
          </button>
          <button className={activeTab === 'users' ? 'tab active' : 'tab'} onClick={() => setActiveTab('users')}>
            Users
          </button>
        </nav>

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
          <article className="stat-card">
            <p>Unique game analyses</p>
            <h2>{overview?.totalGameAnalyses ?? '-'}</h2>
          </article>
          <article className="stat-card">
            <p>Analysis unique viewers</p>
            <h2>{overview?.uniqueAnalysisViewers ?? '-'}</h2>
          </article>
          <article className="stat-card">
            <p>Total puzzles</p>
            <h2>{puzzlesPagination?.total ?? '-'}</h2>
          </article>
        </section>

        {activeTab === 'overview' && <section className="users-section">
          <div className="users-toolbar">
            <div>
              <h3>Game analyses</h3>
              <p className="hint">Latest unique analyses with direct links</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Game ID</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Best move</th>
                  <th>Created</th>
                  <th>Finished</th>
                  <th>Link</th>
                </tr>
              </thead>
              <tbody>
                {loadingAnalyses ? (
                  <tr>
                    <td colSpan={7} className="empty">Loading analyses...</td>
                  </tr>
                ) : analyses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty">No analyses found</td>
                  </tr>
                ) : (
                  analyses.map((analysis) => {
                    const analysisUrl = `${GAME_BASE_URL}/analyze/${encodeURIComponent(analysis.gameId)}`;

                    return (
                      <tr key={analysis.id}>
                        <td className="mono-cell">{analysis.gameId}</td>
                        <td>
                          <span className={`pill ${analysis.status}`}>
                            {analysis.status}
                          </span>
                        </td>
                        <td>{analysis.progressCurrent} / {analysis.progressTotal}</td>
                        <td>{analysis.bestMoveText || '-'}</td>
                        <td>{new Date(analysis.createdAt).toLocaleString()}</td>
                        <td>{analysis.finishedAt ? new Date(analysis.finishedAt).toLocaleString() : '-'}</td>
                        <td>
                          <a className="analysis-link" href={analysisUrl} target="_blank" rel="noreferrer">
                            Open analysis
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>}

        {activeTab === 'puzzles' && <section className="users-section">
          <div className="users-toolbar">
            <div>
              <h3>Puzzles</h3>
              <p className="hint">Generated tasks, user rating and publishing safety</p>
            </div>
            <div className="toolbar-controls">
              <select value={puzzleStatusFilter} onChange={(e) => setPuzzleStatusFilter(e.target.value as typeof puzzleStatusFilter)}>
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
              </select>
              <select value={puzzleBlockedFilter} onChange={(e) => setPuzzleBlockedFilter(e.target.value as typeof puzzleBlockedFilter)}>
                <option value="all">All puzzles</option>
                <option value="active">Only active</option>
                <option value="blocked">Only blocked</option>
              </select>
              <button className="btn" onClick={() => void loadPuzzles()} disabled={loadingPuzzles}>
                Refresh puzzles
              </button>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Side</th>
                  <th>Difficulty</th>
                  <th>Line</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingPuzzles ? (
                  <tr>
                    <td colSpan={9} className="empty">Loading puzzles...</td>
                  </tr>
                ) : puzzles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty">No puzzles found</td>
                  </tr>
                ) : (
                  puzzles.map((puzzle) => {
                    const puzzleUrl = `${GAME_BASE_URL}/puzzles/${encodeURIComponent(puzzle.id)}`;
                    const analysisUrl = `${GAME_BASE_URL}/analyze/${encodeURIComponent(puzzle.sourceGameId)}`;

                    return (
                      <tr key={puzzle.id}>
                        <td>
                          <div className="mono-cell">{puzzle.sourceGameId}</div>
                          <div className="subtle">ply {puzzle.sourcePly}</div>
                        </td>
                        <td>{puzzle.sideToMove}</td>
                        <td>{puzzle.difficulty}</td>
                        <td>{puzzle.solutionLength} plies</td>
                        <td>
                          <span className="rating-cell">👍 {puzzle.likesCount}</span>
                          <span className="rating-cell">👎 {puzzle.dislikesCount}</span>
                        </td>
                        <td>
                          <span className={`pill ${puzzle.isBlocked ? 'blocked' : 'active'}`}>
                            {puzzle.isBlocked ? 'Blocked' : puzzle.status}
                          </span>
                        </td>
                        <td>{new Date(puzzle.createdAt).toLocaleString()}</td>
                        <td>
                          <div className="actions">
                            <a className="analysis-link" href={puzzleUrl} target="_blank" rel="noreferrer">Open puzzle</a>
                            <a className="analysis-link" href={analysisUrl} target="_blank" rel="noreferrer">Analysis</a>
                          </div>
                        </td>
                        <td>
                          {puzzle.isBlocked ? (
                            <button
                              className="btn success"
                              onClick={() => void handleUnblockPuzzle(puzzle)}
                              disabled={actionPuzzleId === puzzle.id}
                            >
                              Unblock
                            </button>
                          ) : (
                            <button
                              className="btn warning"
                              onClick={() => void handleBlockPuzzle(puzzle)}
                              disabled={actionPuzzleId === puzzle.id}
                            >
                              Block
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination-row">
            <span>
              Page {puzzlesPagination?.page || 1} / {puzzlesPagination?.totalPages || 1} | Total puzzles: {puzzlesPagination?.total || 0}
            </span>
            <div className="actions">
              <button className="btn" disabled={!canGoPuzzlesPrev || loadingPuzzles} onClick={() => setPuzzlesPage((p) => p - 1)}>
                Prev
              </button>
              <button className="btn" disabled={!canGoPuzzlesNext || loadingPuzzles} onClick={() => setPuzzlesPage((p) => p + 1)}>
                Next
              </button>
            </div>
          </div>
        </section>}

        {activeTab === 'users' && <section className="users-section">
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
                  <th>Games played</th>
                  <th>Status</th>
                  <th>Verified</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan={8} className="empty">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.login}</td>
                      <td>{user.email}</td>
                      <td>{user.name || '-'}</td>
                      <td>{user.gamesPlayed}</td>
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
        </section>}

        <footer className="footer-row">
          <span>API base: {API_BASE_URL}</span>
          <span>Updated: {generatedAt}</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

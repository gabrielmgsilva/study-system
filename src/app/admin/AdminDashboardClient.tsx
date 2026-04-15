'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  CreditCard,
  DollarSign,
  BookOpen,
  TrendingUp,
  UserPlus,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DashboardData = {
  users: {
    total: number;
    newToday: number;
    newWeek: number;
    newMonth: number;
    active7d: number;
    active30d: number;
  };
  subscriptions: {
    byStatus: Record<string, number>;
    activeTotal: number;
  };
  revenue: { mrr: number };
  plans: { id: number; name: string; slug: string; userCount: number }[];
  study: {
    sessions30d: number;
    byMode: Record<string, number>;
    questionsAnswered: number;
    avgScore: number | null;
    dailyChart: { date: string; flashcard: number; practice: number; test: number }[];
  };
  content: {
    questionsByStatus: Record<string, number>;
  };
  recent: {
    users: {
      id: number;
      email: string;
      name: string | null;
      plan: string | null;
      subscriptionStatus: string | null;
      createdAt: string;
    }[];
    events: {
      id: number;
      eventType: string;
      processedAt: string;
      user: { id: number; email: string; name: string | null };
    }[];
  };
};

type Copy = {
  title: string;
  subtitle: string;
  totalUsers: string;
  thisWeek: string;
  activeSubscriptions: string;
  trialing: string;
  active: string;
  monthlyRevenue: string;
  estimated: string;
  studySessions: string;
  avgScore: string;
  sessionsOverTime: string;
  last30Days: string;
  subscriptionBreakdown: string;
  byStatus: string;
  usersPerPlan: string;
  planDistribution: string;
  contentStatus: string;
  questionsByStatus: string;
  recentRegistrations: string;
  last10Users: string;
  recentSubEvents: string;
  last10Events: string;
  name: string;
  email: string;
  plan: string;
  date: string;
  user: string;
  eventType: string;
  noPlan: string;
  flashcard: string;
  practice: string;
  test: string;
  users: string;
};

const COPY_EN: Copy = {
  title: 'Dashboard',
  subtitle: 'Platform overview and key metrics',
  totalUsers: 'Total Users',
  thisWeek: 'this week',
  activeSubscriptions: 'Active Subscriptions',
  trialing: 'trialing',
  active: 'active',
  monthlyRevenue: 'Monthly Revenue',
  estimated: 'estimated from active plans',
  studySessions: 'Study Sessions (30d)',
  avgScore: 'avg score',
  sessionsOverTime: 'Sessions Over Time',
  last30Days: 'Daily study sessions — last 30 days',
  subscriptionBreakdown: 'Subscription Breakdown',
  byStatus: 'Users by subscription status',
  usersPerPlan: 'Users per Plan',
  planDistribution: 'Distribution of users across plans',
  contentStatus: 'Content Status',
  questionsByStatus: 'Questions by editorial status',
  recentRegistrations: 'Recent Registrations',
  last10Users: 'Last 10 new user sign-ups',
  recentSubEvents: 'Recent Subscription Events',
  last10Events: 'Last 10 Stripe webhook events',
  name: 'Name',
  email: 'Email',
  plan: 'Plan',
  date: 'Date',
  user: 'User',
  eventType: 'Event',
  noPlan: 'No plan',
  flashcard: 'Flashcard',
  practice: 'Practice',
  test: 'Test',
  users: 'users',
};

const COPY_PT: Copy = {
  title: 'Dashboard',
  subtitle: 'Visão geral da plataforma e métricas principais',
  totalUsers: 'Total de Usuários',
  thisWeek: 'esta semana',
  activeSubscriptions: 'Assinaturas Ativas',
  trialing: 'em trial',
  active: 'ativas',
  monthlyRevenue: 'Receita Mensal',
  estimated: 'estimado a partir de planos ativos',
  studySessions: 'Sessões de Estudo (30d)',
  avgScore: 'score médio',
  sessionsOverTime: 'Sessões ao Longo do Tempo',
  last30Days: 'Sessões de estudo diárias — últimos 30 dias',
  subscriptionBreakdown: 'Distribuição de Assinaturas',
  byStatus: 'Usuários por status de assinatura',
  usersPerPlan: 'Usuários por Plano',
  planDistribution: 'Distribuição de usuários entre planos',
  contentStatus: 'Status do Conteúdo',
  questionsByStatus: 'Questões por status editorial',
  recentRegistrations: 'Registros Recentes',
  last10Users: 'Últimos 10 cadastros',
  recentSubEvents: 'Eventos de Assinatura',
  last10Events: 'Últimos 10 eventos de webhook do Stripe',
  name: 'Nome',
  email: 'Email',
  plan: 'Plano',
  date: 'Data',
  user: 'Usuário',
  eventType: 'Evento',
  noPlan: 'Sem plano',
  flashcard: 'Flashcard',
  practice: 'Prática',
  test: 'Teste',
  users: 'usuários',
};

function getCopy(locale: string): Copy {
  return locale === 'pt' ? COPY_PT : COPY_EN;
}

// ---------------------------------------------------------------------------
// Chart colors
// ---------------------------------------------------------------------------

const PIE_COLORS: Record<string, string> = {
  active: '#22c55e',
  trialing: '#3b82f6',
  canceled: '#f59e0b',
  expired: '#ef4444',
  free: '#94a3b8',
};

const QUESTION_COLORS: Record<string, string> = {
  published: '#22c55e',
  review: '#f59e0b',
  draft: '#94a3b8',
  archived: '#ef4444',
};

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="mb-1 h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-7 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
          <CardContent><Skeleton className="h-[250px] w-full" /></CardContent>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AdminDashboardClient({ locale }: { locale: string }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = getCopy(locale);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">Failed to load dashboard data ({error})</p>
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  // Pie chart data
  const pieData = Object.entries(data.subscriptions.byStatus)
    .filter(([, v]) => v > 0)
    .map(([key, value]) => ({ name: key, value }));

  // Plan bar chart data
  const planBarData = data.plans
    .filter((p) => p.userCount > 0)
    .map((p) => ({ name: p.name, users: p.userCount }));

  // Question status bar chart
  const questionBarData = Object.entries(data.content.questionsByStatus).map(([key, value]) => ({
    name: key,
    count: value,
    fill: QUESTION_COLORS[key] ?? '#94a3b8',
  }));

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-CA', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateFull = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString(locale === 'pt' ? 'pt-BR' : 'en-CA', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={copy.totalUsers}
          value={data.users.total.toLocaleString()}
          subtitle={`+${data.users.newWeek} ${copy.thisWeek}`}
          icon={Users}
        />
        <KpiCard
          title={copy.activeSubscriptions}
          value={data.subscriptions.activeTotal.toLocaleString()}
          subtitle={`${data.subscriptions.byStatus.trialing ?? 0} ${copy.trialing}, ${data.subscriptions.byStatus.active ?? 0} ${copy.active}`}
          icon={CreditCard}
        />
        <KpiCard
          title={copy.monthlyRevenue}
          value={`$${data.revenue.mrr.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`}
          subtitle={copy.estimated}
          icon={DollarSign}
        />
        <KpiCard
          title={copy.studySessions}
          value={data.study.sessions30d.toLocaleString()}
          subtitle={data.study.avgScore != null ? `${copy.avgScore}: ${data.study.avgScore}%` : '—'}
          icon={BookOpen}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Area chart — Sessions over time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{copy.sessionsOverTime}</CardTitle>
            <CardDescription>{copy.last30Days}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.study.dailyChart}>
                  <defs>
                    <linearGradient id="gFlashcard" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gPractice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gTest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: string) => v.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid var(--border)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    labelFormatter={(v: string) => formatDate(v)}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="flashcard"
                    name={copy.flashcard}
                    stroke="#3b82f6"
                    fill="url(#gFlashcard)"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="practice"
                    name={copy.practice}
                    stroke="#22c55e"
                    fill="url(#gPractice)"
                    stackId="1"
                  />
                  <Area
                    type="monotone"
                    dataKey="test"
                    name={copy.test}
                    stroke="#f59e0b"
                    fill="url(#gTest)"
                    stackId="1"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie chart — Subscription breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{copy.subscriptionBreakdown}</CardTitle>
            <CardDescription>{copy.byStatus}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {pieData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={PIE_COLORS[entry.name] ?? '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary metrics row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Users per Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{copy.usersPerPlan}</CardTitle>
            <CardDescription>{copy.planDistribution}</CardDescription>
          </CardHeader>
          <CardContent>
            {planBarData.length > 0 ? (
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={planBarData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="users" name={copy.users} fill="#2f55d4" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>

        {/* Content Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{copy.contentStatus}</CardTitle>
            <CardDescription>{copy.questionsByStatus}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={questionBarData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {questionBarData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Activity summary card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity (30d)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{copy.flashcard}</span>
              <span className="text-sm font-semibold">{data.study.byMode.flashcard ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{copy.practice}</span>
              <span className="text-sm font-semibold">{data.study.byMode.practice ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{copy.test}</span>
              <span className="text-sm font-semibold">{data.study.byMode.test ?? 0}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Questions answered</span>
                <span className="text-sm font-semibold">{data.study.questionsAnswered.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active users (7d)</span>
              <span className="text-sm font-semibold">{data.users.active7d}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active users (30d)</span>
              <span className="text-sm font-semibold">{data.users.active30d}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {copy.recentRegistrations}
            </CardTitle>
            <CardDescription>{copy.last10Users}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.name}</TableHead>
                  <TableHead>{copy.plan}</TableHead>
                  <TableHead className="text-right">{copy.date}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{u.name || u.email}</div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </TableCell>
                    <TableCell>
                      {u.plan ? (
                        <Badge variant="secondary" className="text-xs">{u.plan}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{copy.noPlan}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDateFull(u.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {data.recent.users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">—</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Subscription Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {copy.recentSubEvents}
            </CardTitle>
            <CardDescription>{copy.last10Events}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.user}</TableHead>
                  <TableHead>{copy.eventType}</TableHead>
                  <TableHead className="text-right">{copy.date}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent.events.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{e.user.name || e.user.email}</div>
                      <div className="text-xs text-muted-foreground">{e.user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {e.eventType.replace(/\./g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatDateFull(e.processedAt)}
                    </TableCell>
                  </TableRow>
                ))}
                {data.recent.events.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-6">—</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

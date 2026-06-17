import { useState } from "react";
import {
  Search,
  Star,
  GitFork,
  AlertCircle,
  Eye,
  Users,
  Tag,
  Calendar,
  Scale,
  BookOpen,
  Code2,
  Activity,
  Package,
  Shield,
  Loader2,
  ExternalLink,
  TrendingUp,
  Zap,
  XCircle,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const API_BASE = "/api";

// Color palette for charts
const COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#f97316", "#eab308",
  "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];

const SCORE_COLORS = {
  "highly-recommended": "#22c55e",
  recommended: "#3b82f6",
  neutral: "#f59e0b",
  caution: "#ef4444",
};

const VERDICT_LABELS = {
  "highly-recommended": "强烈推荐",
  recommended: "推荐使用",
  neutral: "中规中矩",
  caution: "谨慎使用",
};

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatSize(kb) {
  if (kb >= 1048576) return (kb / 1048576).toFixed(1) + " GB";
  if (kb >= 1024) return (kb / 1024).toFixed(0) + " MB";
  return kb + " KB";
}

// --- Metric Card ---
function MetricCard({ icon: Icon, label, value, color = "#6366f1" }) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ backgroundColor: color + "15", color }}>
        <Icon size={20} />
      </div>
      <div className="metric-body">
        <span className="metric-value">{value}</span>
        <span className="metric-label">{label}</span>
      </div>
    </div>
  );
}

// --- Score Gauge ---
function ScoreGauge({ score, verdict }) {
  const color = SCORE_COLORS[verdict] || "#6366f1";
  const angle = (score / 100) * 180;

  return (
    <div className="score-gauge-wrapper">
      <svg viewBox="0 0 200 120" className="score-gauge">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="30%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        {/* Background arc */}
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="16" />
        {/* Filled arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeDasharray={`${(angle / 180) * 251.3} 251.3`}
          strokeLinecap="round"
          className="gauge-fill"
        />
        {/* Score text */}
        <text x="100" y="85" textAnchor="middle" fontSize="42" fontWeight="bold" fill={color}>
          {score}
        </text>
        <text x="100" y="108" textAnchor="middle" fontSize="13" fill="#6b7280">
          / 100
        </text>
      </svg>
      <div className="verdict-badge" style={{ backgroundColor: color + "15", color }}>
        {VERDICT_LABELS[verdict] || verdict}
      </div>
    </div>
  );
}

// --- Radar Chart for AI Scores ---
function ScoreRadar({ scores }) {
  const data = [
    { name: "代码质量", value: scores.code_quality, fullMark: 100 },
    { name: "社区健康", value: scores.community_health, fullMark: 100 },
    { name: "文档质量", value: scores.documentation, fullMark: 100 },
    { name: "维护活跃度", value: scores.maintenance, fullMark: 100 },
    { name: "受欢迎度", value: scores.popularity, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: "#4b5563" }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} />
        <Radar
          name="评分"
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// --- Language Pie Chart ---
function LanguagePie({ languages }) {
  if (!languages || languages.length === 0) {
    return <div className="empty-chart">暂无语言数据</div>;
  }

  const data = languages.slice(0, 8).map((l) => ({
    name: l.name,
    value: l.percentage,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <span style={{ color: payload[0].payload.fill }}>
            {payload[0].name}: {payload[0].value.toFixed(1)}%
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={110}
          paddingAngle={2}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
        >
          {data.map((_, idx) => (
            <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ color: "#4b5563", fontSize: 13 }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// --- Commit Activity Bar Chart ---
function CommitChart({ activity }) {
  if (!activity || activity.length === 0) {
    return <div className="empty-chart">暂无提交活动数据</div>;
  }

  const data = activity.slice(-12).map((w) => ({
    week: new Date(w.week * 1000).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    }),
    commits: w.total,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis
          dataKey="week"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          interval={Math.floor(data.length / 6)}
        />
        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
        <Bar dataKey="commits" fill="#6366f1" radius={[4, 4, 0, 0]} name="提交数" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// --- Topics Tags ---
function TopicsTags({ topics }) {
  if (!topics || topics.length === 0) return null;
  return (
    <div className="topics-tags">
      {topics.map((t) => (
        <span key={t} className="topic-tag">
          {t}
        </span>
      ))}
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("请输入 GitHub 仓库地址");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const resp = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.detail || `请求失败 (${resp.status})`);
      }

      const result = await resp.json();
      setData(result);
    } catch (e) {
      setError(e.message || "分析失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAnalyze();
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <Code2 size={28} />
            <h1>GitHub 仓库体检工具</h1>
          </div>
          <p className="header-subtitle">
            输入公开仓库地址，一键分析项目健康度、技术栈和社区活跃度
          </p>
        </div>
      </header>

      {/* Search */}
      <section className="search-section">
        <div className="search-box">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入 GitHub 仓库 URL，如 https://github.com/facebook/react"
            className="search-input"
            disabled={loading}
          />
          <button
            className="search-btn"
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
          >
            {loading ? (
              <Loader2 size={20} className="spinner" />
            ) : (
              <Search size={20} />
            )}
            <span>{loading ? "分析中..." : "开始体检"}</span>
          </button>
        </div>
        {error && (
          <div className="error-banner">
            <XCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </section>

      {/* Results */}
      {data && (
        <main className="results">
          {/* Repo Header */}
          <section className="repo-header card">
            <div className="repo-title-row">
              <BookOpen size={22} color="#6366f1" />
              <h2>{data.repo.full_name}</h2>
              {data.repo.archived && (
                <span className="archived-badge">已归档</span>
              )}
            </div>
            {data.repo.description && (
              <p className="repo-desc">{data.repo.description}</p>
            )}
            <TopicsTags topics={data.repo.topics} />
            <a
              href={data.repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="repo-link"
            >
              <ExternalLink size={14} />
              在 GitHub 上查看
            </a>
          </section>

          {/* Metrics Grid */}
          <section className="metrics-grid">
            <MetricCard
              icon={Star}
              label="Stars"
              value={formatNumber(data.repo.stars)}
              color="#f59e0b"
            />
            <MetricCard
              icon={GitFork}
              label="Forks"
              value={formatNumber(data.repo.forks)}
              color="#3b82f6"
            />
            <MetricCard
              icon={Eye}
              label="Watchers"
              value={formatNumber(data.repo.watchers)}
              color="#8b5cf6"
            />
            <MetricCard
              icon={AlertCircle}
              label="Open Issues"
              value={formatNumber(data.repo.open_issues)}
              color="#ef4444"
            />
            <MetricCard
              icon={Users}
              label="Contributors"
              value={formatNumber(data.repo.contributors_count)}
              color="#22c55e"
            />
            <MetricCard
              icon={Package}
              label="Releases"
              value={formatNumber(data.repo.releases_count)}
              color="#06b6d4"
            />
          </section>

          {/* Info Row */}
          <section className="info-row">
            <div className="card info-card">
              <div className="info-item">
                <Code2 size={16} />
                <span className="info-label">主语言</span>
                <span className="info-value">
                  {data.repo.language || "N/A"}
                </span>
              </div>
              <div className="info-item">
                <Scale size={16} />
                <span className="info-label">许可证</span>
                <span className="info-value">
                  {data.repo.license || "未声明"}
                </span>
              </div>
              <div className="info-item">
                <Calendar size={16} />
                <span className="info-label">创建日期</span>
                <span className="info-value">
                  {formatDate(data.repo.created_at)}
                </span>
              </div>
              <div className="info-item">
                <Activity size={16} />
                <span className="info-label">最近更新</span>
                <span className="info-value">
                  {formatDate(data.repo.pushed_at)}
                </span>
              </div>
            </div>
            <div className="card info-card">
              <div className="info-item">
                <BookOpen size={16} />
                <span className="info-label">默认分支</span>
                <span className="info-value">{data.repo.default_branch}</span>
              </div>
              <div className="info-item">
                <Shield size={16} />
                <span className="info-label">仓库大小</span>
                <span className="info-value">{formatSize(data.repo.size_kb)}</span>
              </div>
              <div className="info-item">
                <TrendingUp size={16} />
                <span className="info-label">Issues</span>
                <span className="info-value">
                  {data.repo.has_issues ? "已开启" : "未开启"}
                </span>
              </div>
              <div className="info-item">
                <Zap size={16} />
                <span className="info-label">Discussions</span>
                <span className="info-value">
                  {data.repo.has_discussions ? "已开启" : "未开启"}
                </span>
              </div>
            </div>
          </section>

          {/* Charts Row */}
          <section className="charts-row">
            <div className="card chart-card">
              <h3 className="chart-title">
                <Code2 size={18} />
                编程语言分布
              </h3>
              <LanguagePie languages={data.languages} />
            </div>
            <div className="card chart-card">
              <h3 className="chart-title">
                <Activity size={18} />
                提交活动（近12周）
              </h3>
              <CommitChart activity={data.commit_activity} />
            </div>
          </section>

          {/* AI Score Section */}
          {data.ai_score && (
            <section className="ai-section">
              <h3 className="section-title">
                <Zap size={20} color="#6366f1" />
                AI 智能评分
              </h3>

              <div className="ai-grid">
                <div className="card ai-score-card">
                  <ScoreGauge
                    score={data.ai_score.overall_score}
                    verdict={data.ai_score.verdict}
                  />
                  <p className="ai-summary">{data.ai_score.summary}</p>
                </div>

                <div className="card ai-radar-card">
                  <h4 className="radar-title">五维评分雷达图</h4>
                  <ScoreRadar scores={data.ai_score.scores} />
                </div>

                <div className="card ai-detail-card">
                  <h4 className="detail-title">优势</h4>
                  <ul className="ai-list strengths">
                    {(data.ai_score.strengths || []).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                  <h4 className="detail-title" style={{ marginTop: 16 }}>
                    不足
                  </h4>
                  <ul className="ai-list weaknesses">
                    {(data.ai_score.weaknesses || []).map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}
        </main>
      )}

      {/* Empty State */}
      {!data && !loading && !error && (
        <div className="empty-state">
          <div className="empty-icon">
            <Search size={48} color="#d1d5db" />
          </div>
          <h3>输入仓库地址开始分析</h3>
          <p>支持任意公开 GitHub 仓库，获取全面的健康度报告</p>
          <div className="example-urls">
            <span className="example-label">试试这些：</span>
            <button
              className="example-link"
              onClick={() => setUrl("https://github.com/facebook/react")}
            >
              facebook/react
            </button>
            <button
              className="example-link"
              onClick={() => setUrl("https://github.com/vuejs/core")}
            >
              vuejs/core
            </button>
            <button
              className="example-link"
              onClick={() => setUrl("https://github.com/tensorflow/tensorflow")}
            >
              tensorflow/tensorflow
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

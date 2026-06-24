import { useState, useEffect } from "react";
import { supabase } from "../../services/supabase/client";
import { 
  Cpu, 
  Coins, 
  Activity, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Database,
  RefreshCw,
  Zap
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from "recharts";
import { toast } from "sonner";

interface UsageLog {
  id: string;
  endpoint: string;
  provider: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  latency_ms: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

export function AIAnalyticsSection() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [useDemoData, setUseDemoData] = useState(false);

  // Aggregated Stats
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    avgLatency: 0,
    successRate: 0,
  });

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_usage_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        // Fall back to demo data if DB is empty
        setUseDemoData(true);
        loadDemoData();
      } else {
        setUseDemoData(false);
        setLogs(data);
        calculateStats(data);
      }
    } catch (err: any) {
      console.warn("Failed to fetch live AI logs, falling back to demo data:", err.message);
      setUseDemoData(true);
      loadDemoData();
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: UsageLog[]) => {
    if (data.length === 0) return;
    const totalRequests = data.length;
    const totalTokens = data.reduce((sum, r) => sum + r.input_tokens + r.output_tokens, 0);
    const totalCost = data.reduce((sum, r) => sum + Number(r.estimated_cost), 0);
    const avgLatency = data.reduce((sum, r) => sum + r.latency_ms, 0) / totalRequests;
    const successfulRequests = data.filter(r => r.status === "success").length;
    const successRate = (successfulRequests / totalRequests) * 100;

    setStats({
      totalRequests,
      totalTokens,
      totalCost,
      avgLatency: Math.round(avgLatency),
      successRate: Math.round(successRate),
    });
  };

  const loadDemoData = () => {
    // Generate high-fidelity realistic fallback analytics logs for display
    const demoLogs: UsageLog[] = Array.from({ length: 15 }).map((_, i) => {
      const isGemini = Math.random() > 0.3;
      const isSuccess = Math.random() > 0.08;
      const input = Math.floor(Math.random() * 500) + 300;
      const output = Math.floor(Math.random() * 800) + 400;
      const cost = isGemini 
        ? (input * 0.000075 / 1000) + (output * 0.0003 / 1000)
        : (input * 0.002 / 1000) + (output * 0.01 / 1000);

      const date = new Date();
      date.setHours(date.getHours() - i * 2);

      return {
        id: `demo-${i}`,
        endpoint: "generateItinerary",
        provider: isGemini ? "gemini" : "grok",
        model_name: isGemini ? "gemini-2.5-flash" : "grok-2-1218",
        input_tokens: input,
        output_tokens: output,
        estimated_cost: cost,
        latency_ms: isGemini ? Math.floor(Math.random() * 1500) + 800 : Math.floor(Math.random() * 3000) + 1500,
        status: isSuccess ? "success" : "failed",
        error_message: isSuccess ? null : "Model overloaded or rate limit exceeded",
        created_at: date.toISOString(),
      };
    });

    setLogs(demoLogs);
    calculateStats(demoLogs);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Format data for charts
  const chartData = [...logs].reverse().map(log => ({
    time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: log.latency_ms,
    cost: Number(log.estimated_cost) * 1000, // scale to milli-cents for readable axis
    tokens: log.input_tokens + log.output_tokens,
  }));

  const providerDistribution = logs.reduce((acc: any[], log) => {
    const existing = acc.find(item => item.name === log.provider);
    if (existing) {
      existing.value += 1;
      existing.cost += Number(log.estimated_cost);
    } else {
      acc.push({ name: log.provider, value: 1, cost: Number(log.estimated_cost) });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-display text-4xl tracking-tight">AI Router Analytics</h2>
          <p className="text-sm text-white/50">
            Real-time token consumption, server latency, and model metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {useDemoData && (
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1">
              <Zap className="h-3 w-3" />
              Demo Data Mode
            </span>
          )}
          <button
            onClick={() => {
              fetchAnalytics();
              toast.success("Analytics refreshed successfully.");
            }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <div className="rounded-2xl glass p-5 space-y-2 border border-white/5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider font-mono">Requests</span>
            <Activity className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold font-mono">{stats.totalRequests}</div>
          <div className="text-[9px] text-white/30">Last 100 invocations</div>
        </div>

        <div className="rounded-2xl glass p-5 space-y-2 border border-white/5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider font-mono">Total Tokens</span>
            <Cpu className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold font-mono">
            {stats.totalTokens >= 1000000 
              ? `${(stats.totalTokens / 1000000).toFixed(1)}M` 
              : stats.totalTokens.toLocaleString()}
          </div>
          <div className="text-[9px] text-white/30">Avg {(stats.totalTokens / (stats.totalRequests || 1)).toFixed(0)} / call</div>
        </div>

        <div className="rounded-2xl glass p-5 space-y-2 border border-white/5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider font-mono">Est. Cost</span>
            <Coins className="h-4 w-4 text-gold" />
          </div>
          <div className="text-2xl font-semibold font-mono text-gold">
            ${stats.totalCost.toFixed(4)}
          </div>
          <div className="text-[9px] text-white/30">USD Pricing metrics</div>
        </div>

        <div className="rounded-2xl glass p-5 space-y-2 border border-white/5">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider font-mono">Avg Latency</span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-semibold font-mono">
            {(stats.avgLatency / 1000).toFixed(2)}s
          </div>
          <div className="text-[9px] text-white/30">Network round-trip</div>
        </div>

        <div className="rounded-2xl glass p-5 space-y-2 border border-white/5 col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-white/40">
            <span className="text-xs uppercase tracking-wider font-mono">Reliability</span>
            <CheckCircle className="h-4 w-4 text-emerald" />
          </div>
          <div className={`text-2xl font-semibold font-mono ${stats.successRate >= 90 ? 'text-emerald' : 'text-amber'}`}>
            {stats.successRate}%
          </div>
          <div className="text-[9px] text-white/30">Router success rate</div>
        </div>
      </div>

      {/* Charts Panel */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Latency Area Chart */}
        <div className="rounded-3xl glass p-6 border border-white/5 md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gold" />
              Latency & Cost Trends
            </h3>
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">timeline</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ca8a04" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#ca8a04" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "rgba(20,20,25,0.9)", 
                    borderColor: "rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px"
                  }} 
                />
                <Area type="monotone" dataKey="latency" name="Latency (ms)" stroke="#ca8a04" fillOpacity={1} fill="url(#colorLatency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Distribution Bar Chart */}
        <div className="rounded-3xl glass p-6 border border-white/5 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-gold" />
              Provider Share
            </h3>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {providerDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={providerDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "rgba(20,20,25,0.9)", 
                      borderColor: "rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "12px"
                    }} 
                  />
                  <Bar dataKey="value" name="Calls" fill="var(--color-gold)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-white/30 text-xs">No provider distribution details available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Invocations Table */}
      <div className="rounded-3xl glass border border-white/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-wide flex items-center gap-2">
            <Database className="h-4 w-4 text-white/50" />
            AI Router Call Ledger
          </h3>
          <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded border border-white/5 text-white/50 font-mono">Last 100 rows</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5 text-white/40 font-mono text-[10px] uppercase tracking-wider">
                <th className="px-6 py-3.5 font-normal">Timestamp</th>
                <th className="px-6 py-3.5 font-normal">Endpoint</th>
                <th className="px-6 py-3.5 font-normal">Provider/Model</th>
                <th className="px-6 py-3.5 font-normal text-right">Tokens</th>
                <th className="px-6 py-3.5 font-normal text-right">Est. Cost</th>
                <th className="px-6 py-3.5 font-normal text-right">Latency</th>
                <th className="px-6 py-3.5 font-normal text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-6 py-4 text-white/60 font-mono">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 font-mono font-semibold text-white/80">{log.endpoint}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-white">{log.provider}</span>
                    <span className="text-white/40 block text-[10px] font-mono">{log.model_name}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-white/70">
                    {(log.input_tokens + log.output_tokens).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gold">
                    ${Number(log.estimated_cost).toFixed(5)}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-white/70">
                    {(log.latency_ms / 1000).toFixed(2)}s
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      log.status === "success" 
                        ? "bg-emerald/10 border border-emerald/25 text-emerald" 
                        : "bg-red/10 border border-red/25 text-red"
                    }`}>
                      {log.status === "success" ? (
                        <>
                          <CheckCircle className="h-2.5 w-2.5" />
                          OK
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-2.5 w-2.5" />
                          FAIL
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

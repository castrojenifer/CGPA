import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { calculateCGPAFromGPAs } from '../lib/calculations';
import GlassCard from '../components/GlassCard';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart, Legend,
} from 'recharts';
import { BarChart3, TrendingUp, Activity } from 'lucide-react';

const CustomTooltip = ({ active, payload, label, darkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`px-4 py-3 rounded-xl text-sm ${darkMode ? 'glass' : 'glass-light'}`}>
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const { profile } = useAuth();
  const { darkMode } = useTheme();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    if (!profile) return;

    try {
      const { data: grades } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', profile.id)
        .order('semester');

      if (grades && grades.length > 0) {
        const grouped = {};
        for (const g of grades) {
          if (!grouped[g.semester]) grouped[g.semester] = [];
          grouped[g.semester].push(g);
        }

        let cumulativeCredits = 0;
        let cumulativePoints = 0;

        const data = Object.entries(grouped).map(([sem, subjects]) => {
          let semCredits = 0;
          let semPoints = 0;
          for (const s of subjects) {
            semCredits += s.credit;
            semPoints += s.credit * s.grade_point;
          }

          cumulativeCredits += semCredits;
          cumulativePoints += semPoints;

          const gpa = semCredits > 0 ? parseFloat((semPoints / semCredits).toFixed(2)) : 0;
          const cgpa = cumulativeCredits > 0 ? parseFloat((cumulativePoints / cumulativeCredits).toFixed(2)) : 0;

          return {
            name: `Sem ${sem}`,
            semester: parseInt(sem),
            GPA: gpa,
            CGPA: cgpa,
            credits: semCredits,
            subjects: subjects.length,
          };
        });

        setChartData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const gridColor = darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const textColor = darkMode ? '#94a3b8' : '#64748b';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="space-y-8 max-w-6xl mx-auto">
        <div className="animate-slide-up">
          <h1 className="font-display text-3xl font-bold">Analytics</h1>
          <p className="text-dark-400 mt-1">Visualize your academic performance</p>
        </div>
        <GlassCard className="text-center py-16">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-dark-400 opacity-50" />
          <p className="font-display text-xl font-semibold text-dark-400">No Data Yet</p>
          <p className="text-sm text-dark-500 mt-2">
            Add your semester grades to see charts and analytics
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold">Analytics</h1>
        <p className="text-dark-400 mt-1">Visualize your academic performance</p>
      </div>

      {/* GPA Bar Chart */}
      <GlassCard>
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          Semester-wise GPA
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={40}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={textColor} fontSize={12} />
              <YAxis domain={[0, 10]} stroke={textColor} fontSize={12} />
              <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
              <Bar
                dataKey="GPA"
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                animationDuration={1500}
              />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* CGPA Progress Line */}
      <GlassCard>
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-400" />
          CGPA Progress
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={textColor} fontSize={12} />
              <YAxis domain={[0, 10]} stroke={textColor} fontSize={12} />
              <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="CGPA"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#areaGradient)"
                dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Combined chart */}
      <GlassCard>
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-yellow-400" />
          Performance Trend
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={textColor} fontSize={12} />
              <YAxis domain={[0, 10]} stroke={textColor} fontSize={12} />
              <Tooltip content={<CustomTooltip darkMode={darkMode} />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="GPA"
                stroke="#818cf8"
                strokeWidth={3}
                dot={{ fill: '#818cf8', r: 5, strokeWidth: 2, stroke: '#fff' }}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="CGPA"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }}
                strokeDasharray="5 5"
                animationDuration={2000}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}

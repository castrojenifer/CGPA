import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/GlassCard';
import { Users, Building2, BookOpen, BarChart3, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    departments: 0,
    subjects: 0,
    students: 0,
    admins: 0,
  });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const [deptRes, subRes, studentRes, adminRes] = await Promise.all([
        supabase.from('departments').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin'),
      ]);

      setStats({
        departments: deptRes.count || 0,
        subjects: subRes.count || 0,
        students: studentRes.count || 0,
        admins: adminRes.count || 0,
      });

      // Recent students
      const { data: students } = await supabase
        .from('profiles')
        .select('*, departments(name)')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(5);

      if (students) setRecentStudents(students);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-dark-400 mt-1">Manage your institution's data</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 uppercase tracking-wider">Departments</span>
            <Building2 className="w-5 h-5 text-primary-400" />
          </div>
          <p className="font-display text-3xl font-bold">{stats.departments}</p>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 uppercase tracking-wider">Subjects</span>
            <BookOpen className="w-5 h-5 text-accent-400" />
          </div>
          <p className="font-display text-3xl font-bold">{stats.subjects}</p>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 uppercase tracking-wider">Students</span>
            <Users className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="font-display text-3xl font-bold">{stats.students}</p>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 uppercase tracking-wider">Admins</span>
            <Activity className="w-5 h-5 text-pink-400" />
          </div>
          <p className="font-display text-3xl font-bold">{stats.admins}</p>
        </GlassCard>
      </div>

      {/* Recent Students */}
      <GlassCard>
        <h2 className="font-display text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-400" />
          Recent Students
        </h2>
        {recentStudents.length === 0 ? (
          <p className="text-center py-8 text-dark-400">No students registered yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Register No.</th>
                  <th>Department</th>
                  <th>Semester</th>
                </tr>
              </thead>
              <tbody>
                {recentStudents.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold">{s.full_name || 'N/A'}</td>
                    <td>{s.register_number || 'N/A'}</td>
                    <td>{s.departments?.name || 'N/A'}</td>
                    <td>Sem {s.current_semester || 1}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

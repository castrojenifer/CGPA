import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateCGPAFromGPAs } from '../lib/calculations';
import GlassCard from '../components/GlassCard';
import {
  GraduationCap, Hash, Building2, Calendar, TrendingUp,
  Award, Target, BookOpen, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

const MOCK_SEMESTER_DATA = [
  { semester: 1, gpa: 8.5, totalCredits: 20, subjectCount: 5 },
  { semester: 2, gpa: 9.2, totalCredits: 22, subjectCount: 6 },
  { semester: 3, gpa: 8.8, totalCredits: 18, subjectCount: 5 },
];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [semesterData, setSemesterData] = useState([]);
  const [goalCGPA, setGoalCGPA] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      loadData();
    } else if (!user) {
      // Guest mode
      setSemesterData(MOCK_SEMESTER_DATA);
      setGoalCGPA(9.0);
      setLoading(false);
    }
  }, [profile, user]);

  async function loadData() {
    try {
      const { data: grades } = await supabase
        .from('grades')
        .select('*')
        .eq('student_id', profile.id)
        .order('semester', { ascending: true });

      if (grades && grades.length > 0) {
        // Group grades by semester
        const grouped = {};
        for (const g of grades) {
          if (!grouped[g.semester]) {
            grouped[g.semester] = [];
          }
          grouped[g.semester].push(g);
        }

        const semData = Object.entries(grouped).map(([sem, subjects]) => {
          let totalCredits = 0;
          let totalPoints = 0;
          for (const s of subjects) {
            totalCredits += s.credit;
            totalPoints += s.credit * s.grade_point;
          }
          const gpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;
          return {
            semester: parseInt(sem),
            gpa,
            totalCredits,
            subjectCount: subjects.length,
          };
        });

        setSemesterData(semData);
      } else {
        setSemesterData([]);
      }

      // Load goal
      const { data: goalData } = await supabase
        .from('goals')
        .select('target_cgpa')
        .eq('student_id', profile.id)
        .maybeSingle();

      if (goalData) {
        setGoalCGPA(goalData.target_cgpa);
      } else {
        setGoalCGPA('');
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const currentCGPA = calculateCGPAFromGPAs(semesterData);
  const latestGPA = semesterData.length > 0 ? semesterData[semesterData.length - 1].gpa : 0;
  const currentSemester = semesterData.length > 0 ? semesterData[semesterData.length - 1].semester : profile?.current_semester || 1;
  const totalSubjects = semesterData.reduce((acc, s) => acc + s.subjectCount, 0);

  const prevCGPA = semesterData.length > 1
    ? calculateCGPAFromGPAs(semesterData.slice(0, -1))
    : 0;
  const cgpaTrend = currentCGPA - prevCGPA;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Guest Banner */}
      {!user && (
        <div className="animate-fade-in p-6 rounded-3xl bg-gradient-to-r from-primary-600/20 to-purple-600/20 border border-primary-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-primary-400">Welcome to CGPA Calculator!</h3>
              <p className="text-sm text-dark-400">You are currently in guest mode. Sign in to save your grades and track progress.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn-primary px-6 py-2.5 text-sm">Sign In</Link>
            <Link to="/signup" className="text-sm font-semibold hover:text-primary-400 transition-colors">Create Account</Link>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="animate-slide-up flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Student Dashboard</h1>
          <p className="text-dark-400 mt-1">Track your academic performance at a glance</p>
        </div>
        {!user && <span className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium self-start animate-float">Preview Mode</span>}
      </div>

      {/* Student Info */}
      <GlassCard className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
          {profile?.full_name?.charAt(0)?.toUpperCase() || 'G'}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary-400" />
            <div>
              <p className="text-xs text-dark-400">Name</p>
              <p className="font-semibold text-sm">{profile?.full_name || 'Guest Student'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Hash className="w-5 h-5 text-accent-400" />
            <div>
              <p className="text-xs text-dark-400">Reg. Number</p>
              <p className="font-semibold text-sm">{profile?.register_number || '2024-XXXX'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-xs text-dark-400">Department</p>
              <p className="font-semibold text-sm">{profile?.departments?.name || 'Computer Science'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-400" />
            <div>
              <p className="text-xs text-dark-400">Semester</p>
              <p className="font-semibold text-sm">Semester {currentSemester}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 font-medium uppercase tracking-wider">Current GPA</span>
            <TrendingUp className="w-5 h-5 text-primary-400" />
          </div>
          <p className="font-display text-3xl font-bold">{latestGPA.toFixed(2)}</p>
          <p className="text-xs text-dark-400 mt-1">Semester {currentSemester}</p>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 font-medium uppercase tracking-wider">Overall CGPA</span>
            <Award className="w-5 h-5 text-accent-400" />
          </div>
          <p className="font-display text-3xl font-bold">{currentCGPA.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1">
            {cgpaTrend >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-400" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-400" />
            )}
            <span className={`text-xs ${cgpaTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {cgpaTrend >= 0 ? '+' : ''}{cgpaTrend.toFixed(2)} from previous
            </span>
          </div>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 font-medium uppercase tracking-wider">Goal CGPA</span>
            <Target className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="font-display text-3xl font-bold">{goalCGPA || '—'}</p>
          <p className="text-xs text-dark-400 mt-1">
            {goalCGPA
              ? currentCGPA >= goalCGPA
                ? '🎉 Goal reached!'
                : `${(goalCGPA - currentCGPA).toFixed(2)} points to go`
              : 'Set in Goal Tracker'}
          </p>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 font-medium uppercase tracking-wider">Total Subjects</span>
            <BookOpen className="w-5 h-5 text-pink-400" />
          </div>
          <p className="font-display text-3xl font-bold">{totalSubjects}</p>
          <p className="text-xs text-dark-400 mt-1">
            Across {semesterData.length} semester{semesterData.length !== 1 ? 's' : ''}
          </p>
        </GlassCard>
      </div>

      {/* Semester History */}
      <GlassCard className="overflow-hidden">
        <h2 className="font-display text-xl font-bold mb-4">Semester History</h2>
        {semesterData.length === 0 ? (
          <div className="text-center py-12 text-dark-400">
            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No semester data yet</p>
            <p className="text-sm">{user ? 'Go to Semester Calc to add your grades' : 'Sign in to start tracking your grades'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Subjects</th>
                  <th>Credits</th>
                  <th>GPA</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {semesterData.map((sem) => (
                  <tr key={sem.semester}>
                    <td className="font-semibold">Semester {sem.semester}</td>
                    <td>{sem.subjectCount}</td>
                    <td>{sem.totalCredits}</td>
                    <td>
                      <span className="font-bold text-primary-400">{sem.gpa.toFixed(2)}</span>
                    </td>
                    <td>
                      <div className="w-full bg-dark-700/30 rounded-full h-2 max-w-[120px]">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500"
                          style={{ width: `${(sem.gpa / 10) * 100}%` }}
                        />
                      </div>
                    </td>
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

function Calculator(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="16" height="20" x="4" y="2" rx="2" />
      <line x1="8" x2="16" y1="6" y2="6" />
      <line x1="16" x2="16" y1="14" y2="18" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 10h.01" />
      <path d="M12 14h.01" />
      <path d="M8 14h.01" />
      <path d="M12 18h.01" />
      <path d="M8 18h.01" />
    </svg>
  );
}

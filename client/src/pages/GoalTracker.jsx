import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateCGPAFromGPAs, calculateRequiredGPA } from '../lib/calculations';
import GlassCard from '../components/GlassCard';
import { Target, TrendingUp, Zap, Save, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function GoalTracker() {
  const { profile } = useAuth();
  const [targetCGPA, setTargetCGPA] = useState('');
  const [upcomingCredits, setUpcomingCredits] = useState('20');
  const [semesterData, setSemesterData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [profile]);

  async function loadData() {
    if (!profile) return;

    try {
      // Load grades
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

        const semData = Object.entries(grouped).map(([sem, subjects]) => {
          let totalCredits = 0;
          let totalPoints = 0;
          for (const s of subjects) {
            totalCredits += s.credit;
            totalPoints += s.credit * s.grade_point;
          }
          return {
            semester: parseInt(sem),
            gpa: totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0,
            totalCredits,
          };
        });

        setSemesterData(semData);
      }

      // Load existing goal
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('student_id', profile.id)
        .maybeSingle();

      if (goalData) {
        setTargetCGPA(goalData.target_cgpa?.toString() || '');
        setUpcomingCredits(goalData.upcoming_credits?.toString() || '20');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const currentCGPA = calculateCGPAFromGPAs(semesterData);
  const totalCompletedCredits = semesterData.reduce((acc, s) => acc + s.totalCredits, 0);
  const requiredGPA = targetCGPA
    ? calculateRequiredGPA(
        currentCGPA,
        totalCompletedCredits,
        parseFloat(targetCGPA),
        parseFloat(upcomingCredits) || 20
      )
    : null;

  const isAchievable = requiredGPA !== null && requiredGPA >= 0 && requiredGPA <= 10;
  const alreadyReached = targetCGPA && currentCGPA >= parseFloat(targetCGPA);

  async function handleSaveGoal() {
    if (!targetCGPA) return;
    setSaving(true);
    setSuccess('');

    try {
      // Upsert goal
      const { error } = await supabase
        .from('goals')
        .upsert(
          {
            student_id: profile.id,
            target_cgpa: parseFloat(targetCGPA),
            upcoming_credits: parseFloat(upcomingCredits) || 20,
          },
          { onConflict: 'student_id' }
        );

      if (error) throw error;
      setSuccess('Goal saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
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
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold">Goal Tracker</h1>
        <p className="text-dark-400 mt-1">Set your target CGPA and find out what you need</p>
      </div>

      {/* Current status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 uppercase tracking-wider">Current CGPA</span>
            <TrendingUp className="w-5 h-5 text-primary-400" />
          </div>
          <p className="font-display text-3xl font-bold">{currentCGPA.toFixed(2)}</p>
          <p className="text-xs text-dark-400 mt-1">{semesterData.length} semester(s) completed</p>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 uppercase tracking-wider">Total Credits</span>
            <Zap className="w-5 h-5 text-accent-400" />
          </div>
          <p className="font-display text-3xl font-bold">{totalCompletedCredits}</p>
          <p className="text-xs text-dark-400 mt-1">Credits completed</p>
        </GlassCard>

        <GlassCard className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-dark-400 uppercase tracking-wider">Target CGPA</span>
            <Target className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="font-display text-3xl font-bold">{targetCGPA || '—'}</p>
          <p className="text-xs text-dark-400 mt-1">{alreadyReached ? '🎉 Achieved!' : 'Your goal'}</p>
        </GlassCard>
      </div>

      {/* Goal Input */}
      <GlassCard>
        <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary-400" />
          Set Your Goal
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-dark-400 mb-2 block">
              Target CGPA (out of 10)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              placeholder="e.g., 8.5"
              value={targetCGPA}
              onChange={(e) => setTargetCGPA(e.target.value)}
              className="input-glass"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-dark-400 mb-2 block">
              Expected Credits Next Semester
            </label>
            <input
              type="number"
              min="1"
              max="40"
              placeholder="e.g., 20"
              value={upcomingCredits}
              onChange={(e) => setUpcomingCredits(e.target.value)}
              className="input-glass"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveGoal}
            disabled={saving || !targetCGPA}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="spinner w-5 h-5 border-2" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Goal
              </>
            )}
          </button>
        </div>

        {success && (
          <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm animate-fade-in">
            {success}
          </div>
        )}
      </GlassCard>

      {/* Result */}
      {targetCGPA && (
        <GlassCard className="animate-scale-in">
          <h2 className="font-display text-xl font-bold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Analysis Result
          </h2>

          {alreadyReached ? (
            <div className="flex items-start gap-4 p-6 rounded-xl bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="w-8 h-8 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display text-lg font-bold text-green-400">
                  🎉 Congratulations! You've already reached your goal!
                </h3>
                <p className="text-sm text-dark-400 mt-2">
                  Your current CGPA of <span className="font-bold text-green-400">{currentCGPA.toFixed(2)}</span> is
                  already at or above your target of{' '}
                  <span className="font-bold">{parseFloat(targetCGPA).toFixed(2)}</span>. Keep up the great work!
                </p>
              </div>
            </div>
          ) : isAchievable ? (
            <div className="flex items-start gap-4 p-6 rounded-xl bg-primary-500/10 border border-primary-500/20">
              <ArrowRight className="w-8 h-8 text-primary-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display text-lg font-bold text-primary-400">
                  You need <span className="text-2xl">{requiredGPA.toFixed(2)}</span> GPA in next semester to reach
                  your target
                </h3>
                <p className="text-sm text-dark-400 mt-2">
                  With <span className="font-bold">{upcomingCredits}</span> credits in your upcoming semester, you
                  need to achieve a GPA of{' '}
                  <span className="font-bold text-primary-400">{requiredGPA.toFixed(2)}</span> to bring your
                  overall CGPA to{' '}
                  <span className="font-bold">{parseFloat(targetCGPA).toFixed(2)}</span>.
                </p>
                {requiredGPA > 9 && (
                  <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    This is very ambitious. Consider extending your goal over multiple semesters.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4 p-6 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-display text-lg font-bold text-red-400">
                  Target not achievable in one semester
                </h3>
                <p className="text-sm text-dark-400 mt-2">
                  The required GPA of <span className="font-bold text-red-400">{requiredGPA?.toFixed(2)}</span>{' '}
                  exceeds the maximum of 10.0. Consider adjusting your target or planning over multiple semesters.
                </p>
              </div>
            </div>
          )}

          {/* Progress visualization */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-dark-400 mb-2">
              <span>0</span>
              <span>Current: {currentCGPA.toFixed(2)}</span>
              <span>Target: {parseFloat(targetCGPA).toFixed(2)}</span>
              <span>10</span>
            </div>
            <div className="relative h-4 bg-dark-700/30 rounded-full overflow-hidden">
              <div
                className="absolute h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-1000"
                style={{ width: `${(currentCGPA / 10) * 100}%` }}
              />
              <div
                className="absolute h-full w-0.5 bg-yellow-400"
                style={{ left: `${(parseFloat(targetCGPA) / 10) * 100}%` }}
              />
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

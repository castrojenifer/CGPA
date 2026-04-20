import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateGPA, GRADE_OPTIONS, GRADE_MAP } from '../lib/calculations';
import GlassCard from '../components/GlassCard';
import {
  Plus, Trash2, Save, Calculator, ChevronDown, BookOpen, Award,
} from 'lucide-react';

export default function SemesterCalc() {
  const { profile } = useAuth();
  const [semester, setSemester] = useState(1);
  const [subjects, setSubjects] = useState([
    { id: Date.now(), name: '', credit: '', grade: 'O' },
  ]);
  const [savedSemesters, setSavedSemesters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [availableSubjects, setAvailableSubjects] = useState([]);

  useEffect(() => {
    loadSavedSemesters();
  }, [profile]);

  useEffect(() => {
    loadAvailableSubjects();
  }, [semester, profile]);

  async function loadSavedSemesters() {
    if (!profile) return;
    const { data } = await supabase
      .from('grades')
      .select('semester')
      .eq('student_id', profile.id)
      .order('semester');

    if (data) {
      const unique = [...new Set(data.map((d) => d.semester))];
      setSavedSemesters(unique);
    }
  }

  async function loadAvailableSubjects() {
    if (!profile?.department_id) return;
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .eq('department_id', profile.department_id)
      .eq('semester', semester)
      .order('name');

    if (data) setAvailableSubjects(data);
  }

  async function loadSemesterGrades(sem) {
    setSemester(sem);
    const { data } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', profile.id)
      .eq('semester', sem)
      .order('created_at');

    if (data && data.length > 0) {
      setSubjects(
        data.map((g) => ({
          id: g.id,
          name: g.subject_name,
          credit: g.credit.toString(),
          grade: g.grade,
          dbId: g.id,
        }))
      );
    } else {
      setSubjects([{ id: Date.now(), name: '', credit: '', grade: 'O' }]);
    }
  }

  function addSubject() {
    setSubjects((prev) => [
      ...prev,
      { id: Date.now(), name: '', credit: '', grade: 'O' },
    ]);
  }

  function removeSubject(id) {
    if (subjects.length <= 1) return;
    setSubjects((prev) => prev.filter((s) => s.id !== id));
  }

  function updateSubject(id, field, value) {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }

  function loadFromTemplate(idx, subjectTemplate) {
    setSubjects((prev) =>
      prev.map((s, i) =>
        i === idx
          ? { ...s, name: subjectTemplate.name, credit: subjectTemplate.credits.toString() }
          : s
      )
    );
  }

  const gpa = calculateGPA(subjects);

  async function handleSave() {
    setError('');
    setSuccess('');

    // Validation
    for (const s of subjects) {
      if (!s.name.trim()) {
        setError('All subjects must have a name.');
        return;
      }
      if (!s.credit || parseFloat(s.credit) <= 0) {
        setError('All subjects must have valid credits.');
        return;
      }
    }

    setSaving(true);

    try {
      // Delete existing grades for this semester
      await supabase
        .from('grades')
        .delete()
        .eq('student_id', profile.id)
        .eq('semester', semester);

      // Insert new grades
      const rows = subjects.map((s) => ({
        student_id: profile.id,
        semester,
        subject_name: s.name.trim(),
        credit: parseFloat(s.credit),
        grade: s.grade,
        grade_point: GRADE_MAP[s.grade] ?? 0,
      }));

      const { error: insertError } = await supabase.from('grades').insert(rows);

      if (insertError) throw insertError;

      // Update profile current semester
      await supabase
        .from('profiles')
        .update({ current_semester: semester })
        .eq('id', profile.id);

      setSuccess(`Semester ${semester} grades saved successfully! GPA: ${gpa}`);
      loadSavedSemesters();
    } catch (err) {
      setError(err.message || 'Failed to save grades.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold">Semester Calculator</h1>
        <p className="text-dark-400 mt-1">Add your subjects and calculate GPA</p>
      </div>

      {/* Semester selector & saved semesters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <GlassCard className="flex-1">
          <label className="text-sm font-medium text-dark-400 mb-2 block">Select Semester</label>
          <div className="relative">
            <select
              value={semester}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (savedSemesters.includes(val)) {
                  loadSemesterGrades(val);
                } else {
                  setSemester(val);
                  setSubjects([{ id: Date.now(), name: '', credit: '', grade: 'O' }]);
                }
              }}
              className="input-glass appearance-none cursor-pointer pr-10"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                <option key={s} value={s}>
                  Semester {s} {savedSemesters.includes(s) ? '✓' : ''}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400 pointer-events-none" />
          </div>
        </GlassCard>

        {/* Live GPA preview */}
        <GlassCard className="sm:w-64 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
            <Award className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-xs text-dark-400 uppercase tracking-wider">Semester GPA</p>
            <p className="font-display text-3xl font-bold text-primary-400">{gpa.toFixed(2)}</p>
          </div>
        </GlassCard>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-fade-in">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm animate-fade-in">
          {success}
        </div>
      )}

      {/* Subjects Table */}
      <GlassCard className="overflow-visible">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary-400" />
            Subjects
          </h2>
          <button
            onClick={addSubject}
            className="btn-primary flex items-center gap-2 text-sm !py-2 !px-4"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>

        <div className="space-y-4">
          {/* Header row - desktop */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-2 text-xs font-semibold text-dark-400 uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Subject Name</div>
            <div className="col-span-2">Credits</div>
            <div className="col-span-2">Grade</div>
            <div className="col-span-2">Grade Point</div>
            <div className="col-span-1"></div>
          </div>

          {subjects.map((sub, idx) => (
            <div
              key={sub.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 rounded-xl bg-white/5 dark:bg-dark-800/30 border border-white/5 animate-fade-in"
            >
              <div className="hidden md:flex col-span-1 items-center text-dark-400 font-semibold">
                {idx + 1}
              </div>

              <div className="md:col-span-4 relative">
                <input
                  placeholder="Subject name"
                  value={sub.name}
                  onChange={(e) => updateSubject(sub.id, 'name', e.target.value)}
                  className="input-glass text-sm"
                  list={`subjects-${idx}`}
                />
                {availableSubjects.length > 0 && (
                  <datalist id={`subjects-${idx}`}>
                    {availableSubjects.map((as) => (
                      <option key={as.id} value={as.name} />
                    ))}
                  </datalist>
                )}
              </div>

              <div className="md:col-span-2">
                <input
                  type="number"
                  placeholder="Credits"
                  value={sub.credit}
                  onChange={(e) => updateSubject(sub.id, 'credit', e.target.value)}
                  className="input-glass text-sm"
                  min="1"
                  max="10"
                />
              </div>

              <div className="md:col-span-2 relative">
                <select
                  value={sub.grade}
                  onChange={(e) => updateSubject(sub.id, 'grade', e.target.value)}
                  className="input-glass text-sm appearance-none cursor-pointer"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex items-center">
                <span className="font-display font-bold text-lg text-primary-400">
                  {GRADE_MAP[sub.grade] ?? 0}
                </span>
              </div>

              <div className="md:col-span-1 flex items-center justify-end">
                <button
                  onClick={() => removeSubject(sub.id)}
                  disabled={subjects.length <= 1}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all disabled:opacity-30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Save button */}
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-dark-400">
            Total Credits:{' '}
            <span className="font-bold text-primary-400">
              {subjects.reduce((acc, s) => acc + (parseFloat(s.credit) || 0), 0)}
            </span>
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-success flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="spinner w-5 h-5 border-2" />
            ) : (
              <>
                <Save className="w-5 h-5" /> Save Grades
              </>
            )}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/GlassCard';
import { BookOpen, Plus, Trash2, Edit3, Check, X, ChevronDown } from 'lucide-react';

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ name: '', department_id: '', semester: '1', credits: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [deptRes, subRes] = await Promise.all([
      supabase.from('departments').select('*').order('name'),
      supabase.from('subjects').select('*, departments(name)').order('semester').order('name'),
    ]);

    if (deptRes.data) setDepartments(deptRes.data);
    if (subRes.data) setSubjects(subRes.data);
    setLoading(false);
  }

  async function addSubject(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.department_id || !form.credits) return;
    setError('');

    const { error } = await supabase.from('subjects').insert({
      name: form.name.trim(),
      department_id: form.department_id,
      semester: parseInt(form.semester),
      credits: parseInt(form.credits),
    });

    if (error) {
      setError(error.message);
      return;
    }

    setForm({ name: '', department_id: '', semester: '1', credits: '' });
    loadData();
  }

  async function updateSubject(id) {
    const { error } = await supabase
      .from('subjects')
      .update({
        name: editForm.name.trim(),
        department_id: editForm.department_id,
        semester: parseInt(editForm.semester),
        credits: parseInt(editForm.credits),
      })
      .eq('id', id);

    if (error) {
      setError(error.message);
      return;
    }

    setEditingId(null);
    loadData();
  }

  async function deleteSubject(id) {
    if (!confirm('Delete this subject?')) return;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    loadData();
  }

  const filtered = subjects.filter((s) => {
    if (filterDept && s.department_id !== filterDept) return false;
    if (filterSem && s.semester !== parseInt(filterSem)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold">Subjects</h1>
        <p className="text-dark-400 mt-1">Manage subjects, assign credits and semesters</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add Subject */}
      <GlassCard>
        <h2 className="font-display text-lg font-bold mb-4">Add New Subject</h2>
        <form onSubmit={addSubject} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            placeholder="Subject name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="input-glass text-sm lg:col-span-2"
            required
          />
          <select
            value={form.department_id}
            onChange={(e) => setForm((p) => ({ ...p, department_id: e.target.value }))}
            className="input-glass text-sm appearance-none"
            required
          >
            <option value="">Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            value={form.semester}
            onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
            className="input-glass text-sm appearance-none"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>Sem {s}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Credits"
              min="1"
              max="10"
              value={form.credits}
              onChange={(e) => setForm((p) => ({ ...p, credits: e.target.value }))}
              className="input-glass text-sm flex-1"
              required
            />
            <button type="submit" className="btn-primary !px-4 flex-shrink-0">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </form>
      </GlassCard>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="input-glass text-sm !w-auto appearance-none pr-8"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <select
          value={filterSem}
          onChange={(e) => setFilterSem(e.target.value)}
          className="input-glass text-sm !w-auto appearance-none pr-8"
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
        <span className="text-sm text-dark-400 self-center ml-auto">
          {filtered.length} subject{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Subjects List */}
      <GlassCard className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-dark-400">No subjects found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Credits</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id}>
                    {editingId === sub.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            className="input-glass !py-1 text-sm"
                          />
                        </td>
                        <td>
                          <select
                            value={editForm.department_id}
                            onChange={(e) => setEditForm((p) => ({ ...p, department_id: e.target.value }))}
                            className="input-glass !py-1 text-sm"
                          >
                            {departments.map((d) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            value={editForm.semester}
                            onChange={(e) => setEditForm((p) => ({ ...p, semester: e.target.value }))}
                            className="input-glass !py-1 text-sm"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editForm.credits}
                            onChange={(e) => setEditForm((p) => ({ ...p, credits: e.target.value }))}
                            className="input-glass !py-1 text-sm w-20"
                          />
                        </td>
                        <td className="text-right">
                          <button onClick={() => updateSubject(sub.id)} className="p-2 hover:bg-green-500/10 text-green-400 rounded-lg">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="font-medium">{sub.name}</td>
                        <td>{sub.departments?.name || 'N/A'}</td>
                        <td>Sem {sub.semester}</td>
                        <td>
                          <span className="px-2 py-1 rounded-lg bg-primary-500/10 text-primary-400 text-xs font-bold">
                            {sub.credits}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => {
                              setEditingId(sub.id);
                              setEditForm({
                                name: sub.name,
                                department_id: sub.department_id,
                                semester: sub.semester.toString(),
                                credits: sub.credits.toString(),
                              });
                            }}
                            className="p-2 hover:bg-primary-500/10 text-primary-400 rounded-lg"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSubject(sub.id)}
                            className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </>
                    )}
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

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import GlassCard from '../../components/GlassCard';
import { Building2, Plus, Trash2, Edit3, Check, X } from 'lucide-react';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');

    if (data) setDepartments(data);
    if (error) setError(error.message);
    setLoading(false);
  }

  async function addDepartment(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');

    const { error } = await supabase
      .from('departments')
      .insert({ name: newName.trim() });

    if (error) {
      setError(error.message);
      return;
    }

    setNewName('');
    loadDepartments();
  }

  async function updateDepartment(id) {
    if (!editName.trim()) return;

    const { error } = await supabase
      .from('departments')
      .update({ name: editName.trim() })
      .eq('id', id);

    if (error) {
      setError(error.message);
      return;
    }

    setEditingId(null);
    loadDepartments();
  }

  async function deleteDepartment(id) {
    if (!confirm('Are you sure? This will affect related subjects and students.')) return;

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) {
      setError(error.message);
      return;
    }

    loadDepartments();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold">Departments</h1>
        <p className="text-dark-400 mt-1">Manage college departments</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Add Department */}
      <GlassCard>
        <form onSubmit={addDepartment} className="flex gap-3">
          <div className="flex-1 relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <input
              type="text"
              placeholder="New department name (e.g., Computer Science)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-glass pl-12"
            />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2 flex-shrink-0">
            <Plus className="w-5 h-5" /> Add
          </button>
        </form>
      </GlassCard>

      {/* Department List */}
      <GlassCard>
        <h2 className="font-display text-xl font-bold mb-4">All Departments ({departments.length})</h2>
        {departments.length === 0 ? (
          <p className="text-center py-8 text-dark-400">No departments yet. Add one above.</p>
        ) : (
          <div className="space-y-2">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/5 dark:bg-dark-800/30 border border-white/5 animate-fade-in"
              >
                <Building2 className="w-5 h-5 text-primary-400 flex-shrink-0" />

                {editingId === dept.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-glass flex-1 !py-2 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={() => updateDepartment(dept.id)}
                      className="p-2 rounded-lg hover:bg-green-500/10 text-green-400 transition-all"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{dept.name}</span>
                    <button
                      onClick={() => {
                        setEditingId(dept.id);
                        setEditName(dept.name);
                      }}
                      className="p-2 rounded-lg hover:bg-primary-500/10 text-primary-400 transition-all"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteDepartment(dept.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

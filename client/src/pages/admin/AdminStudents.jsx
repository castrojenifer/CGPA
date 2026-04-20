import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { calculateCGPAFromGPAs } from '../../lib/calculations';
import GlassCard from '../../components/GlassCard';
import { Users, Search, Eye, X, FileDown, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [studRes, deptRes] = await Promise.all([
      supabase.from('profiles').select('*, departments(name)').eq('role', 'student').order('full_name'),
      supabase.from('departments').select('*').order('name'),
    ]);

    if (studRes.data) setStudents(studRes.data);
    if (deptRes.data) setDepartments(deptRes.data);
    setLoading(false);
  }

  async function viewStudent(student) {
    setSelectedStudent(student);

    const { data: grades } = await supabase
      .from('grades')
      .select('*')
      .eq('student_id', student.id)
      .order('semester');

    if (grades) {
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
          subjects,
        };
      });

      setStudentGrades(semData);
    }
  }

  function downloadStudentReport(student, semData) {
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();

    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pw, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Student Report — ${student.full_name}`, pw / 2, 22, { align: 'center' });

    doc.setTextColor(30, 30, 30);
    let y = 50;

    const cgpa = calculateCGPAFromGPAs(semData);

    autoTable(doc, {
      startY: y,
      head: [],
      body: [
        ['Name', student.full_name || 'N/A'],
        ['Register Number', student.register_number || 'N/A'],
        ['Department', student.departments?.name || 'N/A'],
        ['CGPA', cgpa.toFixed(2)],
      ],
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    });

    y = doc.lastAutoTable.finalY + 10;

    for (const sem of semData) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Semester ${sem.semester} — GPA: ${sem.gpa.toFixed(2)}`, 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Subject', 'Credits', 'Grade', 'Points']],
        body: sem.subjects.map((s) => [s.subject_name, s.credit, s.grade, s.grade_point]),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 },
      });

      y = doc.lastAutoTable.finalY + 10;
    }

    doc.save(`Report_${student.full_name?.replace(/\s+/g, '_')}.pdf`);
  }

  const filtered = students.filter((s) => {
    if (filterDept && s.department_id !== filterDept) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.full_name?.toLowerCase().includes(q) ||
        s.register_number?.toLowerCase().includes(q)
      );
    }
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
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold">Students</h1>
        <p className="text-dark-400 mt-1">View and manage student records</p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search by name or register number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-glass pl-12"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="input-glass !w-auto appearance-none text-sm"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Students Table */}
      <GlassCard className="overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold">
            {filtered.length} Student{filtered.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center py-8 text-dark-400">No students found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Reg. Number</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td className="font-semibold">{s.full_name || 'N/A'}</td>
                    <td>{s.register_number || 'N/A'}</td>
                    <td>{s.departments?.name || 'N/A'}</td>
                    <td>Sem {s.current_semester || 1}</td>
                    <td className="text-right">
                      <button
                        onClick={() => viewStudent(s)}
                        className="p-2 hover:bg-primary-500/10 text-primary-400 rounded-lg transition-all"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-bold">{selectedStudent.full_name}</h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <p className="text-dark-400">Register Number</p>
                <p className="font-semibold">{selectedStudent.register_number || 'N/A'}</p>
              </div>
              <div>
                <p className="text-dark-400">Department</p>
                <p className="font-semibold">{selectedStudent.departments?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-dark-400">CGPA</p>
                <p className="font-bold text-primary-400 text-lg">
                  {calculateCGPAFromGPAs(studentGrades).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-dark-400">Semesters</p>
                <p className="font-semibold">{studentGrades.length}</p>
              </div>
            </div>

            {studentGrades.length > 0 ? (
              <div className="space-y-4">
                {studentGrades.map((sem) => (
                  <div key={sem.semester} className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Semester {sem.semester}</h3>
                      <span className="text-primary-400 font-bold">GPA: {sem.gpa.toFixed(2)}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {sem.subjects.map((s) => (
                        <div key={s.id} className="flex justify-between">
                          <span>{s.subject_name}</span>
                          <span className="text-dark-400">
                            {s.grade} ({s.credit} cr)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-6 text-dark-400">No grades recorded yet.</p>
            )}

            {studentGrades.length > 0 && (
              <button
                onClick={() => downloadStudentReport(selectedStudent, studentGrades)}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                <FileDown className="w-5 h-5" /> Download Report
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

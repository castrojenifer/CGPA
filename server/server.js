import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase admin client (uses service role key for elevated access)
const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// ─── Health check ────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Admin: Get all students with their CGPA ─────────────────────
app.get('/api/admin/students-report', async (req, res) => {
  try {
    const { data: students, error: sErr } = await supabase
      .from('profiles')
      .select('*, departments(name)')
      .eq('role', 'student')
      .order('full_name');

    if (sErr) throw sErr;

    // Fetch all grades
    const { data: allGrades, error: gErr } = await supabase
      .from('grades')
      .select('*')
      .order('semester');

    if (gErr) throw gErr;

    // Calculate CGPA for each student
    const report = students.map((student) => {
      const grades = allGrades.filter((g) => g.student_id === student.id);
      let totalCredits = 0;
      let totalPoints = 0;

      for (const g of grades) {
        totalCredits += g.credit;
        totalPoints += g.credit * g.grade_point;
      }

      const cgpa = totalCredits > 0 ? parseFloat((totalPoints / totalCredits).toFixed(2)) : 0;

      // Group by semester for GPA
      const semesters = {};
      for (const g of grades) {
        if (!semesters[g.semester]) semesters[g.semester] = { credits: 0, points: 0 };
        semesters[g.semester].credits += g.credit;
        semesters[g.semester].points += g.credit * g.grade_point;
      }

      const semesterGPAs = Object.entries(semesters).map(([sem, data]) => ({
        semester: parseInt(sem),
        gpa: data.credits > 0 ? parseFloat((data.points / data.credits).toFixed(2)) : 0,
      }));

      return {
        id: student.id,
        full_name: student.full_name,
        register_number: student.register_number,
        department: student.departments?.name || 'N/A',
        current_semester: student.current_semester,
        cgpa,
        semesters: semesterGPAs,
        total_subjects: grades.length,
        total_credits: totalCredits,
      };
    });

    res.json({ success: true, data: report });
  } catch (err) {
    console.error('Error generating students report:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Admin: Get department-wise stats ────────────────────────────
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [deptRes, subRes, studentRes] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('subjects').select('*'),
      supabase.from('profiles').select('id, department_id, role').eq('role', 'student'),
    ]);

    const departments = deptRes.data || [];
    const subjects = subRes.data || [];
    const students = studentRes.data || [];

    const deptStats = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      studentCount: students.filter((s) => s.department_id === dept.id).length,
      subjectCount: subjects.filter((s) => s.department_id === dept.id).length,
    }));

    res.json({
      success: true,
      data: {
        totalDepartments: departments.length,
        totalSubjects: subjects.length,
        totalStudents: students.length,
        departments: deptStats,
      },
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Error handler ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ─── Start ───────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   CGPA Calculator Server Running    ║
  ║   http://localhost:${PORT}              ║
  ╚══════════════════════════════════════╝
  `);
});

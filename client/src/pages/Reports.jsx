import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { calculateCGPAFromGPAs, calculateRequiredGPA } from '../lib/calculations';
import GlassCard from '../components/GlassCard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, Loader2, FileText, Calendar } from 'lucide-react';

export default function Reports() {
  const { profile, user } = useAuth();
  const [semesterData, setSemesterData] = useState([]);
  const [allGrades, setAllGrades] = useState([]);
  const [goalData, setGoalData] = useState(null);
  const [generating, setGenerating] = useState(false);
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

      if (grades) {
        setAllGrades(grades);
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
        setSemesterData(semData);
      }

      const { data: goal } = await supabase
        .from('goals')
        .select('*')
        .eq('student_id', profile.id)
        .maybeSingle();

      if (goal) setGoalData(goal);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const currentCGPA = calculateCGPAFromGPAs(semesterData);
  const totalCredits = semesterData.reduce((a, s) => a + s.totalCredits, 0);

  function generatePDF() {
    setGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('CGPA Calculator Report', pageWidth / 2, 18, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}`, pageWidth / 2, 28, { align: 'center' });

      // Student details
      doc.setTextColor(30, 30, 30);
      let y = 55;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Student Details', 14, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const details = [
        ['Name', profile?.full_name || 'N/A'],
        ['Register Number', profile?.register_number || 'N/A'],
        ['Department', profile?.departments?.name || 'N/A'],
        ['Overall CGPA', currentCGPA.toFixed(2)],
        ['Total Credits Completed', totalCredits.toString()],
        ['Semesters Completed', semesterData.length.toString()],
      ];

      autoTable(doc, {
        startY: y,
        head: [],
        body: details,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 50 },
        },
        margin: { left: 14 },
      });

      y = doc.lastAutoTable.finalY + 15;

      // Semester Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Semester Summary', 14, y);
      y += 4;

      const semRows = semesterData.map((s) => [
        `Semester ${s.semester}`,
        s.subjects.length.toString(),
        s.totalCredits.toString(),
        s.gpa.toFixed(2),
      ]);

      autoTable(doc, {
        startY: y,
        head: [['Semester', 'Subjects', 'Credits', 'GPA']],
        body: semRows,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 4 },
        margin: { left: 14 },
      });

      y = doc.lastAutoTable.finalY + 15;

      // Detailed grades per semester
      for (const sem of semesterData) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Semester ${sem.semester} — GPA: ${sem.gpa.toFixed(2)}`, 14, y);
        y += 4;

        const gradeRows = sem.subjects.map((s) => [
          s.subject_name,
          s.credit.toString(),
          s.grade,
          s.grade_point.toString(),
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Subject', 'Credits', 'Grade', 'Grade Point']],
          body: gradeRows,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontSize: 9 },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: 14 },
        });

        y = doc.lastAutoTable.finalY + 12;
      }

      // Goal tracking
      if (goalData) {
        if (y > 240) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Goal Tracking', 14, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const reqGPA = calculateRequiredGPA(
          currentCGPA,
          totalCredits,
          goalData.target_cgpa,
          goalData.upcoming_credits || 20
        );

        doc.text(`Target CGPA: ${goalData.target_cgpa}`, 14, y);
        y += 6;
        doc.text(`Current CGPA: ${currentCGPA.toFixed(2)}`, 14, y);
        y += 6;

        if (currentCGPA >= goalData.target_cgpa) {
          doc.setTextColor(16, 185, 129);
          doc.text('✓ Goal already achieved!', 14, y);
        } else if (reqGPA !== null && reqGPA <= 10) {
          doc.text(
            `Required GPA in next semester (${goalData.upcoming_credits || 20} credits): ${reqGPA.toFixed(2)}`,
            14,
            y
          );
        } else {
          doc.setTextColor(239, 68, 68);
          doc.text('Target not achievable in a single semester.', 14, y);
        }
      }

      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `CGPA Calculator Report — Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`CGPA_Report_${profile?.full_name?.replace(/\s+/g, '_') || 'Student'}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setGenerating(false);
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
      <div className="animate-slide-up">
        <h1 className="font-display text-3xl font-bold">Reports</h1>
        <p className="text-dark-400 mt-1">Download your comprehensive academic report</p>
      </div>

      {/* Report Preview */}
      <GlassCard>
        <div className="flex items-start gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold">Academic Report</h2>
            <p className="text-sm text-dark-400 mt-1">
              Complete PDF report with student details, all semester grades, GPA/CGPA, and goal tracking
            </p>
          </div>
        </div>

        {/* Report Contents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-white/5 dark:bg-dark-800/30 border border-white/5">
            <p className="text-xs text-dark-400 uppercase tracking-wider mb-2">Report Includes</p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400" />
                Student Details & Department
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                Semester-wise GPA Summary
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                Detailed Subject Grades
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                Overall CGPA
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                Goal Tracking Results
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white/5 dark:bg-dark-800/30 border border-white/5">
            <p className="text-xs text-dark-400 uppercase tracking-wider mb-2">Quick Stats</p>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-dark-400">Semesters</span>
                <span className="font-bold">{semesterData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-dark-400">Total Subjects</span>
                <span className="font-bold">{allGrades.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-dark-400">Total Credits</span>
                <span className="font-bold">{totalCredits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-dark-400">CGPA</span>
                <span className="font-bold text-primary-400">{currentCGPA.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        {semesterData.length === 0 ? (
          <div className="text-center py-8 text-dark-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No data to generate report</p>
            <p className="text-sm">Add your semester grades first</p>
          </div>
        ) : (
          <button
            onClick={generatePDF}
            disabled={generating}
            className="btn-primary w-full flex items-center justify-center gap-3 text-lg !py-4 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <FileDown className="w-6 h-6" />
                Download PDF Report
              </>
            )}
          </button>
        )}
      </GlassCard>
    </div>
  );
}

/* Grade-point mapping for 10-point scale */

export const GRADE_MAP = {
  'O':  10,
  'A+': 9,
  'A':  8,
  'B+': 7,
  'B':  6,
  'C':  5,
  'P':  4,
  'F':  0,
};

export const GRADE_OPTIONS = Object.keys(GRADE_MAP);

/**
 * Calculate GPA for a single semester.
 * subjects: [{ credit: number, grade: string }]
 */
export function calculateGPA(subjects) {
  if (!subjects || subjects.length === 0) return 0;

  let totalCredits = 0;
  let totalPoints = 0;

  for (const s of subjects) {
    const credit = parseFloat(s.credit) || 0;
    const gradePoint = GRADE_MAP[s.grade] ?? 0;
    totalCredits += credit;
    totalPoints += credit * gradePoint;
  }

  if (totalCredits === 0) return 0;
  return parseFloat((totalPoints / totalCredits).toFixed(2));
}

/**
 * Calculate CGPA from multiple semesters.
 * semesters: [{ subjects: [{ credit, grade }] }]
 */
export function calculateCGPA(semesters) {
  if (!semesters || semesters.length === 0) return 0;

  let totalCredits = 0;
  let totalPoints = 0;

  for (const sem of semesters) {
    for (const s of sem.subjects) {
      const credit = parseFloat(s.credit) || 0;
      const gradePoint = GRADE_MAP[s.grade] ?? 0;
      totalCredits += credit;
      totalPoints += credit * gradePoint;
    }
  }

  if (totalCredits === 0) return 0;
  return parseFloat((totalPoints / totalCredits).toFixed(2));
}

/**
 * Calculate CGPA from an array of { gpa, totalCredits } per semester.
 */
export function calculateCGPAFromGPAs(semesterData) {
  if (!semesterData || semesterData.length === 0) return 0;

  let totalCredits = 0;
  let totalWeighted = 0;

  for (const s of semesterData) {
    const credits = parseFloat(s.totalCredits) || 0;
    const gpa = parseFloat(s.gpa) || 0;
    totalCredits += credits;
    totalWeighted += credits * gpa;
  }

  if (totalCredits === 0) return 0;
  return parseFloat((totalWeighted / totalCredits).toFixed(2));
}

/**
 * Calculate required GPA in next semester to reach target CGPA.
 * currentCGPA: number
 * completedCredits: number
 * targetCGPA: number
 * upcomingCredits: number (estimated credits for next semester)
 */
export function calculateRequiredGPA(currentCGPA, completedCredits, targetCGPA, upcomingCredits) {
  if (upcomingCredits <= 0) return null;

  const requiredGPA =
    (targetCGPA * (completedCredits + upcomingCredits) - currentCGPA * completedCredits) /
    upcomingCredits;

  return parseFloat(requiredGPA.toFixed(2));
}

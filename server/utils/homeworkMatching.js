const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeHomeworkClassValue = (value) => String(value ?? '').trim().toUpperCase();

export const resolveHomeworkAudience = ({ grade, section, assignedGrade, assignedSection }) => {
  const resolvedGrade = normalizeHomeworkClassValue(assignedGrade || grade);
  const resolvedSection = normalizeHomeworkClassValue(assignedSection || section);

  if (!resolvedGrade || !resolvedSection) {
    return null;
  }

  return {
    grade: resolvedGrade,
    section: resolvedSection
  };
};

export const buildHomeworkClassFilter = ({ grade, section }) => ({
  grade: new RegExp(`^\\s*${escapeRegex(normalizeHomeworkClassValue(grade))}\\s*$`, 'i'),
  section: new RegExp(`^\\s*${escapeRegex(normalizeHomeworkClassValue(section))}\\s*$`, 'i')
});

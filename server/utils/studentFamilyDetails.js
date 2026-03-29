export const normalizeStudentFamilyDetails = (payload = {}) => ({
  motherName: payload.motherName?.toString().trim() || '',
  fatherName: payload.fatherName?.toString().trim() || '',
  guardianName: payload.guardianName?.toString().trim() || ''
});

export const validateStudentFamilyDetails = (payload = {}) => {
  const familyDetails = normalizeStudentFamilyDetails(payload);
  const hasParents = Boolean(familyDetails.motherName && familyDetails.fatherName);
  const hasGuardian = Boolean(familyDetails.guardianName);

  if (!hasParents && !hasGuardian) {
    return {
      isValid: false,
      message: 'Enter both mother and father names, or provide a guardian name.',
      familyDetails
    };
  }

  return {
    isValid: true,
    familyDetails
  };
};

export const applyStudentFamilyDetails = (student, familyDetails) => {
  student.motherName = familyDetails.motherName;
  student.fatherName = familyDetails.fatherName;
  student.guardianName = familyDetails.guardianName;
};

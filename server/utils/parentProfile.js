const trimValue = (value) => value?.toString().trim() || '';

const normalizeStudentFamily = (student = {}) => ({
  motherName: trimValue(student.motherName),
  fatherName: trimValue(student.fatherName),
  guardianName: trimValue(student.guardianName)
});

export const buildParentDisplayName = (student = {}, fallback = 'Parent') => {
  const { motherName, fatherName, guardianName } = normalizeStudentFamily(student);

  if (motherName && fatherName) {
    return `${motherName} & ${fatherName}`;
  }

  if (guardianName) {
    return guardianName;
  }

  if (motherName || fatherName) {
    return motherName || fatherName;
  }

  return fallback;
};

export const buildParentDetailsLabel = (student = {}, fallback = 'Parent') => {
  const { motherName, fatherName, guardianName } = normalizeStudentFamily(student);

  if (motherName && fatherName) {
    return `Mother: ${motherName} | Father: ${fatherName}`;
  }

  if (guardianName) {
    return `Guardian: ${guardianName}`;
  }

  if (motherName || fatherName) {
    return `Parent: ${motherName || fatherName}`;
  }

  return fallback;
};

export const enrichParentLinkedRecord = (record, { parentKey = 'parentId', studentKey = 'studentId' } = {}) => {
  const recordObject = typeof record?.toObject === 'function' ? record.toObject() : record;
  if (!recordObject || typeof recordObject !== 'object') {
    return recordObject;
  }

  const parentObject = recordObject[parentKey];
  const studentObject = recordObject[studentKey] || parentObject?.studentId || {};
  const fallbackName = parentObject?.name || 'Parent';
  const parentDisplayName = buildParentDisplayName(studentObject, fallbackName);
  const parentDetailsLabel = buildParentDetailsLabel(studentObject, parentDisplayName);

  return {
    ...recordObject,
    parentDisplayName,
    parentDetailsLabel,
    [parentKey]: parentObject && typeof parentObject === 'object'
      ? { ...parentObject, name: parentDisplayName }
      : parentObject
  };
};

export const enrichParentLinkedRecords = (records = [], options) => (
  Array.isArray(records) ? records.map((record) => enrichParentLinkedRecord(record, options)) : []
);

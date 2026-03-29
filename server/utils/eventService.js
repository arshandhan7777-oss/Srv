import EventRegistration from '../models/EventRegistration.js';
import { buildParentDisplayName } from './parentProfile.js';

export async function hydrateEvents(events, { respondentId } = {}) {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  const eventIds = events.map(event => event._id);
  const registrations = await EventRegistration.find({ eventId: { $in: eventIds } })
    .populate('parentId', 'name srvNumber studentId')
    .populate('studentId', 'name srvNumber motherName fatherName guardianName')
    .populate('facultyId', 'name')
    .sort({ acknowledgedAt: -1, createdAt: -1 });

  const groupedRegistrations = registrations.reduce((acc, registration) => {
    const key = String(registration.eventId);
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(registration);
    return acc;
  }, {});

  return events.map((event) => {
    const eventObject = typeof event.toObject === 'function' ? event.toObject() : event;
    const liveRegistrations = groupedRegistrations[String(event._id)] || [];
    const archivedRegistrations = Array.isArray(eventObject.archiveSummary?.enrolledStudents)
      ? eventObject.archiveSummary.enrolledStudents.map((entry, index) => ({
          _id: `archived-${eventObject._id}-${index}`,
          parentDisplayName: entry.parentName || '',
          parentId: entry.parentName ? { name: entry.parentName } : null,
          studentId: { name: entry.parentName ? `${entry.parentName} • ${entry.studentName}` : entry.studentName },
          participantNames: [],
          note: '',
          acknowledgedAt: entry.acknowledgedAt,
          isArchivedSnapshot: true
        }))
      : [];
    const eventRegistrations = liveRegistrations.length > 0 ? liveRegistrations : archivedRegistrations;
    const normalizedRegistrations = eventRegistrations.map((registration) => {
      if (registration.isArchivedSnapshot) {
        return registration;
      }

      const registrationObject = typeof registration.toObject === 'function' ? registration.toObject() : registration;
      const parentDisplayName = buildParentDisplayName(
        registrationObject.studentId,
        registrationObject.parentId?.name || 'Parent'
      );

      return {
        ...registrationObject,
        parentDisplayName,
        parentId: registrationObject.parentId
          ? { ...registrationObject.parentId, name: parentDisplayName }
          : registrationObject.parentId
      };
    });
    const myRegistration = respondentId
      ? liveRegistrations.find(registration => String(registration.parentId?._id || registration.parentId) === String(respondentId)) || null
      : null;

    return {
      ...eventObject,
      registrationCount: eventObject.archiveSummary?.registrationCount ?? normalizedRegistrations.length,
      registrations: normalizedRegistrations,
      myRegistration,
      isArchived: Boolean(eventObject.archivedAt)
    };
  });
}

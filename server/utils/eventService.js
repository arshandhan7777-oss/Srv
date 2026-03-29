import EventRegistration from '../models/EventRegistration.js';

export async function hydrateEvents(events, { respondentId } = {}) {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  const eventIds = events.map(event => event._id);
  const registrations = await EventRegistration.find({ eventId: { $in: eventIds } })
    .populate('parentId', 'name srvNumber')
    .populate('studentId', 'name srvNumber')
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
          studentId: { name: entry.studentName },
          participantNames: [],
          note: '',
          acknowledgedAt: entry.acknowledgedAt,
          isArchivedSnapshot: true
        }))
      : [];
    const eventRegistrations = liveRegistrations.length > 0 ? liveRegistrations : archivedRegistrations;
    const myRegistration = respondentId
      ? liveRegistrations.find(registration => String(registration.parentId?._id || registration.parentId) === String(respondentId)) || null
      : null;

    return {
      ...eventObject,
      registrationCount: eventObject.archiveSummary?.registrationCount ?? eventRegistrations.length,
      registrations: eventRegistrations,
      myRegistration,
      isArchived: Boolean(eventObject.archivedAt)
    };
  });
}

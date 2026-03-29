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
    const eventRegistrations = groupedRegistrations[String(event._id)] || [];
    const myRegistration = respondentId
      ? eventRegistrations.find(registration => String(registration.parentId?._id || registration.parentId) === String(respondentId)) || null
      : null;

    return {
      ...eventObject,
      registrationCount: eventRegistrations.length,
      registrations: eventRegistrations,
      myRegistration
    };
  });
}

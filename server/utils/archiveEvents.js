import Event from '../models/Event.js';
import EventRegistration from '../models/EventRegistration.js';
import { buildParentDisplayName } from './parentProfile.js';

export async function archivePastEvents() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const expiredEvents = await Event.find({
      eventDate: { $lt: todayStart },
      status: { $ne: 'CANCELLED' },
      archivedAt: { $exists: false }
    });

    for (const event of expiredEvents) {
      const registrations = await EventRegistration.find({ eventId: event._id })
        .populate('studentId', 'name motherName fatherName guardianName')
        .sort({ acknowledgedAt: -1, createdAt: -1 });

      event.status = 'CLOSED';
      event.archivedAt = new Date();
      event.archiveSummary = {
        registrationCount: registrations.length,
        enrolledStudents: registrations.map((registration) => ({
          studentName: registration.studentId?.name || 'Student',
          parentName: buildParentDisplayName(registration.studentId, ''),
          acknowledgedAt: registration.acknowledgedAt || registration.createdAt
        }))
      };

      await event.save();

      if (registrations.length > 0) {
        await EventRegistration.deleteMany({ eventId: event._id });
      }
    }
  } catch (error) {
    console.error('[Archive Events] Error archiving past events:', error.message);
  }
}

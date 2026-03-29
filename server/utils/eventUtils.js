export const validateParticipantNames = (rawNames) => {
  if (!rawNames) {
    return [];
  }

  const list = Array.isArray(rawNames)
    ? rawNames
    : String(rawNames)
        .split(',')
        .map(item => item.trim());

  return [...new Set(list.map(item => String(item || '').trim()).filter(Boolean))];
};

export const normalizeEventPayload = ({ title, description, venue, eventDate }) => {
  if (!String(title || '').trim()) {
    throw new Error('Event title is required.');
  }

  if (!String(description || '').trim()) {
    throw new Error('Event description is required.');
  }

  if (!eventDate) {
    throw new Error('Event date is required.');
  }

  return {
    title: String(title).trim(),
    description: String(description).trim(),
    venue: String(venue || '').trim(),
    eventDate: new Date(eventDate)
  };
};

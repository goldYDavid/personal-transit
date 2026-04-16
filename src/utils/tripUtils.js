function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function validatePreferences(preferences) {
  const hasHomeStops = ensureArray(preferences.home_preferred_stop_ids).length > 0;
  const hasWorkStops = ensureArray(preferences.work_preferred_stop_ids).length > 0;

  if (!hasHomeStops || !hasWorkStops) {
    throw new Error('חסרות תחנות מועדפות בבית או בעבודה. יש לעדכן הגדרות משתמש.');
  }
}

export function getDirectionPreferences(preferences, direction) {
  const homeStops = ensureArray(preferences.home_preferred_stop_ids);
  const workStops = ensureArray(preferences.work_preferred_stop_ids);
  const preferredLines = ensureArray(preferences.preferred_line_numbers);

  if (direction === 'toWork') {
    return {
      originStopIds: homeStops,
      destinationStopIds: workStops,
      preferredLines
    };
  }

  return {
    originStopIds: workStops,
    destinationStopIds: homeStops,
    preferredLines
  };
}

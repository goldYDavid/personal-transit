export function toLocalTimeString(isoString) {
  if (!isoString) return 'לא זמין';
  return new Date(isoString).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
}

export function minutesBetween(fromIso, toIso) {
  if (!fromIso || !toIso) return 0;
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  return Math.max(0, Math.round((to - from) / 60000));
}

export function getTomorrowAtHour(hourText) {
  const [hours = '07', minutes = '30'] = hourText.split(':');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(Number(hours), Number(minutes), 0, 0);
  return tomorrow.toISOString();
}

export function toIsoAtTodayTime(timeText) {
  const [hours = '08', minutes = '00'] = timeText.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toISOString();
}

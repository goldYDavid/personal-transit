import { openBusService } from './openBusService';
import { rankingService } from './rankingService';
import { getTomorrowAtHour, toIsoAtTodayTime } from '../utils/timeUtils';
import { getDirectionPreferences, validatePreferences } from '../utils/tripUtils';
import { supabase } from '../lib/supabase';
import { appConfig } from '../config/appConfig';

async function getUserPlanningPreferences(userId) {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error('לא נמצאו הגדרות תכנון משתמש ב-Supabase.');
  }

  return data;
}

async function collectRelevantTrips({ originStopIds, destinationStopIds, requestedAt }) {
  const tripsByPair = await Promise.all(
    originStopIds.flatMap((originStopId) =>
      destinationStopIds.map((destinationStopId) =>
        openBusService.getPlannedTrips({ originStopId, destinationStopId, requestedAt })
      )
    )
  );

  return tripsByPair.flat();
}

export const plannerService = {
  resolveRequestedTime(mode, manualTime) {
    if (mode === 'now') {
      return new Date().toISOString();
    }

    if (mode === 'tomorrowMorning') {
      return getTomorrowAtHour(appConfig.defaultMorningHour);
    }

    return toIsoAtTodayTime(manualTime || '08:00');
  },

  async getPersonalTrips({ userId, direction, requestedAt }) {
    const preferences = await getUserPlanningPreferences(userId);
    validatePreferences(preferences);

    const { originStopIds, destinationStopIds, preferredLines } = getDirectionPreferences(
      preferences,
      direction
    );

    const rawTrips = await collectRelevantTrips({
      originStopIds,
      destinationStopIds,
      requestedAt
    });

    if (!rawTrips.length) {
      throw new Error('לא נמצאו נסיעות רלוונטיות ב-OpenBus לזמן שנבחר.');
    }

    const filtered = rawTrips.filter((trip) => {
      if (!trip.lines.length || !preferredLines.length) {
        return true;
      }

      return trip.lines.some((line) => preferredLines.includes(line));
    });

    if (!filtered.length) {
      throw new Error('נמצאו נסיעות אך אין התאמה לקווים המועדפים שהוגדרו.');
    }

    return rankingService.rankTrips(filtered);
  }
};

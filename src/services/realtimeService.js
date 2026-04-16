import { openBusService } from './openBusService';

export const realtimeService = {
  async attachRealtimeStatus(trips) {
    const enriched = await Promise.all(
      trips.map(async (trip) => {
        try {
          const rt = await openBusService.getRealtimeForTrip(trip.id);
          return {
            ...trip,
            realtimeStatus: rt?.status || 'לא זמין',
            realtimeDelayMinutes: rt?.delayMinutes || 0
          };
        } catch (_error) {
          return {
            ...trip,
            realtimeStatus: 'לא זמין',
            realtimeDelayMinutes: 0
          };
        }
      })
    );

    return enriched;
  }
};

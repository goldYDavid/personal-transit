import { appConfig } from '../config/appConfig';

function computeScore(trip) {
  const w = appConfig.rankingWeights;
  return (
    trip.totalMinutes * w.totalMinutes +
    trip.walkingMinutes * w.walkingMinutes +
    trip.transfers * w.transfers +
    (trip.realtimeDelayMinutes || 0) * w.delayMinutes
  );
}

export const rankingService = {
  rankTrips(trips) {
    return [...trips]
      .map((trip) => ({ ...trip, score: computeScore(trip) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, appConfig.maxResults);
  }
};

import { minutesBetween, toLocalTimeString } from '../utils/timeUtils';

function mapStep(rawStep) {
  const typeMap = {
    walk: 'הליכה',
    board: 'עלייה',
    alight: 'ירידה',
    transfer: 'החלפה',
    arrival: 'הגעה'
  };

  return {
    type: rawStep.type || 'step',
    line: rawStep.line_number || null,
    text: rawStep.description || typeMap[rawStep.type] || 'שלב נסיעה'
  };
}

function extractLines(rawTrip) {
  if (!Array.isArray(rawTrip.legs)) {
    return [];
  }
  return rawTrip.legs.map((leg) => leg.line_number).filter(Boolean);
}

export function adaptOpenBusTrip(rawTrip) {
  const departure = rawTrip.departure_time;
  const arrival = rawTrip.arrival_time;

  return {
    id: rawTrip.trip_id || `${departure}-${arrival}-${Math.random().toString(16).slice(2)}`,
    departureTime: toLocalTimeString(departure),
    arrivalTime: toLocalTimeString(arrival),
    departureIso: departure,
    arrivalIso: arrival,
    totalMinutes: minutesBetween(departure, arrival),
    walkingMinutes: rawTrip.walking_minutes ?? 0,
    transfers: rawTrip.transfers ?? 0,
    lines: extractLines(rawTrip),
    realtimeStatus: null,
    realtimeDelayMinutes: 0,
    originStopName: rawTrip.origin_stop?.name || 'לא זמין',
    destinationStopName: rawTrip.destination_stop?.name || 'לא זמין',
    primaryCoordinates: {
      origin: {
        lat: rawTrip.origin_stop?.lat ?? null,
        lon: rawTrip.origin_stop?.lon ?? null
      },
      destination: {
        lat: rawTrip.destination_stop?.lat ?? null,
        lon: rawTrip.destination_stop?.lon ?? null
      }
    },
    steps: Array.isArray(rawTrip.steps)
      ? rawTrip.steps.map(mapStep)
      : [
          { type: 'board', text: 'עלייה לקו בתחנת המוצא' },
          { type: 'arrival', text: 'הגעה לתחנת היעד' }
        ]
  };
}

export function adaptStops(rawStops) {
  return (rawStops || []).map((stop) => ({
    id: stop.stop_id,
    name: stop.stop_name,
    lat: stop.lat,
    lon: stop.lon
  }));
}

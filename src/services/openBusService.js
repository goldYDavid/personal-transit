import { minutesBetween, toLocalTimeString } from '../utils/timeUtils';

const baseUrl = import.meta.env.VITE_OPENBUS_BASE_URL;
const SEARCH_WINDOW_HOURS = 3;
const MAX_ORIGIN_BOARDINGS = 24;
const MAX_RIDE_STOPS = 300;

const stopCache = new Map();
const rideStopsCache = new Map();

function buildServerErrorMessage({ response, rawBody, url }) {
  const body = rawBody.trim();

  if (body) {
    return `${response.status} ${response.statusText}\n${url.toString()}\n${body}`;
  }

  return `${response.status} ${response.statusText}\n${url.toString()}\nאין גוף תשובה`;
}

function addHoursToIso(isoString, hoursToAdd) {
  const date = new Date(isoString);
  date.setHours(date.getHours() + hoursToAdd);
  return date.toISOString();
}

function toStopView(stop) {
  return {
    id: stop.id,
    name: stop.name,
    lat: stop.lat,
    lon: stop.lon
  };
}

function normalizeLineValue(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return String(value);
}

function buildDirectTrip({ originRideStop, destinationRideStop, originStop, destinationStop }) {
  const departure = originRideStop.departure_time || originRideStop.arrival_time;
  const arrival = destinationRideStop.arrival_time || destinationRideStop.departure_time;
  const line = normalizeLineValue(
    originRideStop.gtfs_route__route_short_name || originRideStop.gtfs_route__line_ref
  );

  return {
    id: `gtfs-${originRideStop.gtfs_ride_id}`,
    departureTime: toLocalTimeString(departure),
    arrivalTime: toLocalTimeString(arrival),
    departureIso: departure,
    arrivalIso: arrival,
    totalMinutes: minutesBetween(departure, arrival),
    walkingMinutes: 0,
    transfers: 0,
    lines: line ? [line] : [],
    realtimeStatus: null,
    realtimeDelayMinutes: 0,
    originStopName: originStop.name || 'לא זמין',
    destinationStopName: destinationStop.name || 'לא זמין',
    primaryCoordinates: {
      origin: {
        lat: originStop.lat ?? null,
        lon: originStop.lon ?? null
      },
      destination: {
        lat: destinationStop.lat ?? null,
        lon: destinationStop.lon ?? null
      }
    },
    steps: [
      {
        type: 'board',
        line,
        text: line
          ? `עלייה לקו ${line} בתחנת ${originStop.name || originRideStop.gtfs_stop__name || 'המוצא'}`
          : `עלייה בתחנת ${originStop.name || originRideStop.gtfs_stop__name || 'המוצא'}`
      },
      {
        type: 'arrival',
        text: `ירידה בתחנת ${destinationStop.name || destinationRideStop.gtfs_stop__name || 'היעד'}`
      }
    ]
  };
}

function uniqueById(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

async function request(path, params = {}) {
  if (!baseUrl) {
    throw new Error('חסר משתנה סביבה VITE_OPENBUS_BASE_URL עבור נתוני תחבורה אמיתיים.');
  }

  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  let response;
  try {
    console.log('OPENBUS URL:', url.toString());
    response = await fetch(url.toString());
  } catch (_networkError) {
    throw new Error(`שגיאת רשת מול OpenBus\n${url.toString()}`);
  }

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(buildServerErrorMessage({ response, rawBody, url }));
  }

  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch (_parseError) {
    throw new Error(rawBody);
  }
}

async function getStopById(stopId) {
  if (stopCache.has(stopId)) {
    return stopCache.get(stopId);
  }

  const payload = await request('/gtfs_stops/get', { id: stopId });
  const stop = toStopView(payload);
  stopCache.set(stopId, stop);
  return stop;
}

async function getRideStopsByRideId(rideId) {
  if (rideStopsCache.has(rideId)) {
    return rideStopsCache.get(rideId);
  }

  const payload = await request('/gtfs_ride_stops/list', {
    gtfs_ride_ids: rideId,
    limit: MAX_RIDE_STOPS,
    order_by: 'stop_sequence asc'
  });

  rideStopsCache.set(rideId, payload);
  return payload;
}

async function getOriginBoardings(originStopId, requestedAt) {
  return request('/gtfs_ride_stops/list', {
    gtfs_stop_ids: originStopId,
    arrival_time_from: requestedAt,
    arrival_time_to: addHoursToIso(requestedAt, SEARCH_WINDOW_HOURS),
    limit: MAX_ORIGIN_BOARDINGS,
    order_by: 'arrival_time asc'
  });
}

export const openBusService = {
  async getStopsByIds(stopIds) {
    const stops = await Promise.all(stopIds.map((stopId) => getStopById(stopId)));
    return stops.filter(Boolean);
  },

  async getPlannedTrips({ originStopId, destinationStopId, requestedAt }) {
    const [originStop, destinationStop, originBoardings] = await Promise.all([
      getStopById(originStopId),
      getStopById(destinationStopId),
      getOriginBoardings(originStopId, requestedAt)
    ]);

    const directTrips = [];

    for (const originRideStop of originBoardings) {
      const rideStops = await getRideStopsByRideId(originRideStop.gtfs_ride_id);
      const destinationRideStop = rideStops.find(
        (rideStop) =>
          Number(rideStop.gtfs_stop_id) === Number(destinationStopId) &&
          Number(rideStop.stop_sequence) > Number(originRideStop.stop_sequence)
      );

      if (!destinationRideStop) {
        continue;
      }

      directTrips.push(
        buildDirectTrip({
          originRideStop,
          destinationRideStop,
          originStop,
          destinationStop
        })
      );
    }

    return uniqueById(directTrips).sort(
      (a, b) => new Date(a.departureIso).getTime() - new Date(b.departureIso).getTime()
    );
  },

  async getRealtimeForTrip(_tripId) {
    return null;
  }
};

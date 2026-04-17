import { minutesBetween, toLocalTimeString } from '../utils/timeUtils';

const baseUrl = import.meta.env.VITE_OPENBUS_BASE_URL;
const SEARCH_WINDOW_HOURS = 3;
const TRANSFER_SEARCH_WINDOW_HOURS = 2;
const MAX_ORIGIN_BOARDINGS = 24;
const MAX_TRANSFER_BOARDINGS = 12;
const MAX_RIDE_STOPS = 300;
const MAX_TRANSFER_CANDIDATES_PER_RIDE = 8;
const MAX_RESULTS = 12;

const stopByCodeCache = new Map();
const rideStopsCache = new Map();
const boardingsCache = new Map();

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
    code: stop.code,
    name: stop.name,
    city: stop.city,
    lat: stop.lat,
    lon: stop.lon,
    date: stop.date
  };
}

function normalizeLineValue(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  return String(value);
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

function sortByMostRecentStop(firstStop, secondStop) {
  const firstDate = new Date(firstStop.date || 0).getTime();
  const secondDate = new Date(secondStop.date || 0).getTime();

  if (secondDate !== firstDate) {
    return secondDate - firstDate;
  }

  return Number(secondStop.id) - Number(firstStop.id);
}

function getStopLabel(stop) {
  return stop?.name || 'לא זמין';
}

function getLineFromRideStop(rideStop) {
  return normalizeLineValue(
    rideStop.gtfs_route__route_short_name || rideStop.gtfs_route__line_ref
  );
}

function buildTripBase({
  id,
  departure,
  arrival,
  lines,
  transfers,
  originStop,
  destinationStop,
  mapPoints,
  steps
}) {
  return {
    id,
    departureTime: toLocalTimeString(departure),
    arrivalTime: toLocalTimeString(arrival),
    departureIso: departure,
    arrivalIso: arrival,
    totalMinutes: minutesBetween(departure, arrival),
    walkingMinutes: 0,
    transfers,
    lines: lines.filter(Boolean),
    realtimeStatus: null,
    realtimeDelayMinutes: 0,
    originStopName: getStopLabel(originStop),
    destinationStopName: getStopLabel(destinationStop),
    primaryCoordinates: {
      origin: {
        lat: originStop?.lat ?? null,
        lon: originStop?.lon ?? null
      },
      destination: {
        lat: destinationStop?.lat ?? null,
        lon: destinationStop?.lon ?? null
      }
    },
    mapPoints,
    steps
  };
}

function buildDirectTrip({ originRideStop, destinationRideStop, originStop, destinationStop }) {
  const departure = originRideStop.departure_time || originRideStop.arrival_time;
  const arrival = destinationRideStop.arrival_time || destinationRideStop.departure_time;
  const line = getLineFromRideStop(originRideStop);

  return buildTripBase({
    id: `direct-${originRideStop.gtfs_ride_id}-${originStop.code}-${destinationStop.code}`,
    departure,
    arrival,
    lines: [line],
    transfers: 0,
    originStop,
    destinationStop,
    mapPoints: [
      {
        id: `origin-${originStop.code}`,
        role: 'origin',
        label: 'תחנת מוצא',
        name: getStopLabel(originStop),
        lat: originStop?.lat ?? null,
        lon: originStop?.lon ?? null
      },
      {
        id: `destination-${destinationStop.code}`,
        role: 'destination',
        label: 'תחנת יעד',
        name: getStopLabel(destinationStop),
        lat: destinationStop?.lat ?? null,
        lon: destinationStop?.lon ?? null
      }
    ],
    steps: [
      {
        type: 'board',
        line,
        text: line
          ? `עלייה לקו ${line} בתחנת ${getStopLabel(originStop)}`
          : `עלייה בתחנת ${getStopLabel(originStop)}`
      },
      {
        type: 'arrival',
        text: `ירידה בתחנת ${getStopLabel(destinationStop)}`
      }
    ]
  });
}

function buildTransferTrip({
  firstLegOriginRideStop,
  secondLegTransferRideStop,
  secondLegDestinationRideStop,
  originStop,
  transferStop,
  destinationStop
}) {
  const firstLine = getLineFromRideStop(firstLegOriginRideStop);
  const secondLine = getLineFromRideStop(secondLegTransferRideStop);
  const departure = firstLegOriginRideStop.departure_time || firstLegOriginRideStop.arrival_time;
  const arrival = secondLegDestinationRideStop.arrival_time || secondLegDestinationRideStop.departure_time;

  return buildTripBase({
    id: `transfer-${firstLegOriginRideStop.gtfs_ride_id}-${secondLegTransferRideStop.gtfs_ride_id}-${originStop.code}-${destinationStop.code}`,
    departure,
    arrival,
    lines: [firstLine, secondLine],
    transfers: 1,
    originStop,
    destinationStop,
    mapPoints: [
      {
        id: `origin-${originStop.code}`,
        role: 'origin',
        label: 'תחנת מוצא',
        name: getStopLabel(originStop),
        lat: originStop?.lat ?? null,
        lon: originStop?.lon ?? null
      },
      {
        id: `transfer-${transferStop.code}`,
        role: 'transfer',
        label: 'תחנת החלפה',
        name: getStopLabel(transferStop),
        lat: transferStop?.lat ?? null,
        lon: transferStop?.lon ?? null
      },
      {
        id: `destination-${destinationStop.code}`,
        role: 'destination',
        label: 'תחנת יעד',
        name: getStopLabel(destinationStop),
        lat: destinationStop?.lat ?? null,
        lon: destinationStop?.lon ?? null
      }
    ],
    steps: [
      {
        type: 'board',
        line: firstLine,
        text: firstLine
          ? `עלייה לקו ${firstLine} בתחנת ${getStopLabel(originStop)}`
          : `עלייה בתחנת ${getStopLabel(originStop)}`
      },
      {
        type: 'transfer',
        line: secondLine,
        text: secondLine
          ? `החלפה בתחנת ${getStopLabel(transferStop)} לקו ${secondLine}`
          : `החלפה בתחנת ${getStopLabel(transferStop)}`
      },
      {
        type: 'arrival',
        text: `ירידה בתחנת ${getStopLabel(destinationStop)}`
      }
    ]
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

async function resolveStopByCode(stopCode) {
  const normalizedCode = String(stopCode);

  if (stopByCodeCache.has(normalizedCode)) {
    return stopByCodeCache.get(normalizedCode);
  }

  const payload = await request('/gtfs_stops/list', {
    code: normalizedCode,
    limit: 20,
    order_by: 'date desc,id desc'
  });

  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error(`לא נמצאה תחנה עבור קוד ${normalizedCode}`);
  }

  const stop = toStopView([...payload].sort(sortByMostRecentStop)[0]);
  stopByCodeCache.set(normalizedCode, stop);
  return stop;
}

async function getRideStopsByRideId(rideId) {
  const cacheKey = String(rideId);

  if (rideStopsCache.has(cacheKey)) {
    return rideStopsCache.get(cacheKey);
  }

  const payload = await request('/gtfs_ride_stops/list', {
    gtfs_ride_ids: rideId,
    limit: MAX_RIDE_STOPS,
    order_by: 'stop_sequence asc'
  });

  rideStopsCache.set(cacheKey, payload);
  return payload;
}

async function getBoardingsForStop(stopId, fromIso, toIso, limit) {
  const cacheKey = `${stopId}|${fromIso}|${toIso}|${limit}`;

  if (boardingsCache.has(cacheKey)) {
    return boardingsCache.get(cacheKey);
  }

  const payload = await request('/gtfs_ride_stops/list', {
    gtfs_stop_ids: stopId,
    arrival_time_from: fromIso,
    arrival_time_to: toIso,
    limit,
    order_by: 'arrival_time asc'
  });

  boardingsCache.set(cacheKey, payload);
  return payload;
}

function findRideStopAfterSequence(rideStops, stopId, minSequence) {
  return rideStops.find(
    (rideStop) =>
      Number(rideStop.gtfs_stop_id) === Number(stopId) &&
      Number(rideStop.stop_sequence) > Number(minSequence)
  );
}

function getTransferCandidates(rideStops, minSequence) {
  return rideStops
    .filter((rideStop) => Number(rideStop.stop_sequence) > Number(minSequence))
    .filter((rideStop) => Number(rideStop.pickup_type) !== 1)
    .slice(0, MAX_TRANSFER_CANDIDATES_PER_RIDE);
}

async function findDirectOrTransferTrips({ originStop, destinationStop, requestedAt }) {
  const results = [];
  const originBoardings = await getBoardingsForStop(
    originStop.id,
    requestedAt,
    addHoursToIso(requestedAt, SEARCH_WINDOW_HOURS),
    MAX_ORIGIN_BOARDINGS
  );

  for (const originRideStop of originBoardings) {
    const firstRideStops = await getRideStopsByRideId(originRideStop.gtfs_ride_id);
    const directDestinationRideStop = findRideStopAfterSequence(
      firstRideStops,
      destinationStop.id,
      originRideStop.stop_sequence
    );

    if (directDestinationRideStop) {
      results.push(
        buildDirectTrip({
          originRideStop,
          destinationRideStop: directDestinationRideStop,
          originStop,
          destinationStop
        })
      );
      continue;
    }

    const transferCandidates = getTransferCandidates(firstRideStops, originRideStop.stop_sequence);

    for (const firstLegTransferRideStop of transferCandidates) {
      const transferStop = toStopView({
        id: firstLegTransferRideStop.gtfs_stop_id,
        code: firstLegTransferRideStop.gtfs_stop__code,
        name: firstLegTransferRideStop.gtfs_stop__name,
        city: firstLegTransferRideStop.gtfs_stop__city,
        lat: firstLegTransferRideStop.gtfs_stop__lat,
        lon: firstLegTransferRideStop.gtfs_stop__lon,
        date: firstLegTransferRideStop.gtfs_stop__date
      });

      const transferAt = firstLegTransferRideStop.arrival_time || firstLegTransferRideStop.departure_time;
      const secondLegBoardings = await getBoardingsForStop(
        transferStop.id,
        transferAt,
        addHoursToIso(transferAt, TRANSFER_SEARCH_WINDOW_HOURS),
        MAX_TRANSFER_BOARDINGS
      );

      for (const secondLegTransferRideStop of secondLegBoardings) {
        if (String(secondLegTransferRideStop.gtfs_ride_id) === String(originRideStop.gtfs_ride_id)) {
          continue;
        }

        const secondRideStops = await getRideStopsByRideId(secondLegTransferRideStop.gtfs_ride_id);
        const secondLegDestinationRideStop = findRideStopAfterSequence(
          secondRideStops,
          destinationStop.id,
          secondLegTransferRideStop.stop_sequence
        );

        if (!secondLegDestinationRideStop) {
          continue;
        }

        results.push(
          buildTransferTrip({
            firstLegOriginRideStop: originRideStop,
            secondLegTransferRideStop,
            secondLegDestinationRideStop,
            originStop,
            transferStop,
            destinationStop
          })
        );
      }
    }
  }

  return uniqueById(results)
    .sort((a, b) => new Date(a.departureIso).getTime() - new Date(b.departureIso).getTime())
    .slice(0, MAX_RESULTS);
}

export const openBusService = {
  async getStopsByIds(stopCodes) {
    const stops = await Promise.all(stopCodes.map((stopCode) => resolveStopByCode(stopCode)));
    return stops.filter(Boolean);
  },

  async getPlannedTrips({ originStopId, destinationStopId, requestedAt }) {
    const [originStop, destinationStop] = await Promise.all([
      resolveStopByCode(originStopId),
      resolveStopByCode(destinationStopId)
    ]);

    return findDirectOrTransferTrips({
      originStop,
      destinationStop,
      requestedAt
    });
  },

  async getRealtimeForTrip(_tripId) {
    return null;
  }
};

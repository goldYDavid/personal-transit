import { adaptOpenBusTrip, adaptStops } from '../adapters/openBusAdapter';

const baseUrl = import.meta.env.VITE_OPENBUS_BASE_URL;

function buildServerErrorMessage({ response, rawBody, url }) {
  const body = rawBody.trim();

  if (body) {
    return `${response.status} ${response.statusText}\n${url.toString()}\n${body}`;
  }

  return `${response.status} ${response.statusText}\n${url.toString()}\nאין גוף תשובה`;
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

export const openBusService = {
  async getStopsByIds(stopIds) {
    const payload = await request('/stops', { ids: stopIds.join(',') });
    if (!Array.isArray(payload?.stops)) {
      throw new Error('חסר מידע תחנות מ-OpenBus.');
    }
    return adaptStops(payload.stops);
  },

  async getPlannedTrips({ originStopId, destinationStopId, requestedAt }) {
    const payload = await request('/trips', {
      origin_stop_id: originStopId,
      destination_stop_id: destinationStopId,
      departure_time: requestedAt
    });

    if (!Array.isArray(payload?.trips)) {
      throw new Error('OpenBus לא החזיר נסיעות זמינות למסלול המבוקש.');
    }

    return payload.trips.map(adaptOpenBusTrip);
  },

  async getRealtimeForTrip(tripId) {
    const payload = await request('/realtime', { trip_id: tripId });
    if (!payload) {
      return null;
    }
    return {
      status: payload.status || 'לא זמין',
      delayMinutes: Number(payload.delay_minutes || 0)
    };
  }
};

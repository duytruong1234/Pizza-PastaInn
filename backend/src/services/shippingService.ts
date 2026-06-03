import prisma from '../lib/prisma';

// Helper function to calculate Haversine (straight-line) distance in meters
function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number, useRoadFactor = true): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const straightLine = R * c; // Distance in meters

  if (!useRoadFactor) return straightLine;

  // Use a smaller road factor for very short distances (< 1km).
  // OSRM/OSM data in Vietnam sometimes misses internal roads in shopping centers
  // so we cap the road factor to avoid inflating short distances.
  const factor = straightLine < 1000 ? 1.2 : 1.35;
  return straightLine * factor;
}

// Calculate tiered shipping fee based on distance in meters
// > 5km (5000 meters) is 20,000 VND, otherwise free
export function calculateTieredShippingFee(distanceMeters: number): number {
  return distanceMeters > 5000 ? 20000 : 0;
}

export class ShippingService {
  /**
   * Geocode query using MapTiler Geocoding API
   */
  static async geocodeAddress(query: string) {
    const apiKey = process.env.MAPTILER_API_KEY;
    if (!apiKey) {
      throw new Error('MAPTILER_API_KEY is not configured in backend env');
    }

    const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${apiKey}&country=vn&limit=5&language=vi`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`MapTiler Geocoding API returned status ${res.status}`);
    }

    const data = (await res.json()) as any;
    return data.features || [];
  }

  /**
   * Calculate nearest store, road distance (via OSRM) and shipping fee
   */
  static async calculateShipping(lat: number, lon: number) {
    // 1. Fetch all active stores with valid coordinates
    const stores = await prisma.store.findMany({
      where: { is_active: true },
    });

    const validStores = stores.filter((store) => {
      if (!store.latitude || !store.longitude) return false;
      const storeLat = Number(store.latitude);
      const storeLon = Number(store.longitude);
      return !isNaN(storeLat) && !isNaN(storeLon);
    });

    if (validStores.length === 0) {
      throw new Error('No active stores with valid coordinates found in database');
    }

    let closestStore: typeof validStores[0] | null = null;
    let minDistanceMeters = Infinity;
    let finalDurationSeconds = 0;
    let usedOSRM = false;

    // 2. Compute routing distance for each store
    for (const store of validStores) {
      const storeLat = Number(store.latitude);
      const storeLon = Number(store.longitude);

      try {
        // Call OSRM routing API (driving profile)
        // OSRM coordinates are in [longitude,latitude] order!
        const osrmUrl = `http://router.project-osrm.org/route/v1/driving/${lon},${lat};${storeLon},${storeLat}?overview=false`;

        // Timeout OSRM request after 3 seconds to fall back to Haversine if service is slow
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(osrmUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.routes && data.routes.length > 0) {
            const osrmDistance = Number(data.routes[0].distance); // meters
            const duration = Number(data.routes[0].duration); // seconds

            // Sanity check: compare OSRM result vs straight-line distance.
            // OSM data in Vietnam often lacks internal roads in shopping complexes,
            // causing OSRM to route the long way around.
            // If OSRM distance > straight-line × 2.5, discard it and use Haversine instead.
            const straightLine = getHaversineDistance(lat, lon, storeLat, storeLon, false);
            const maxReasonable = straightLine * 2.5;

            if (osrmDistance <= maxReasonable) {
              console.log(`[ShippingService] OSRM ✅ "${store.store_name}": ${(osrmDistance / 1000).toFixed(2)} km (straight-line: ${(straightLine / 1000).toFixed(2)} km)`);
              if (osrmDistance < minDistanceMeters) {
                minDistanceMeters = osrmDistance;
                closestStore = store;
                finalDurationSeconds = duration;
                usedOSRM = true;
              }
              continue;
            } else {
              // OSRM is routing way too far — likely missing internal paths
              const haversineDist = getHaversineDistance(lat, lon, storeLat, storeLon, true);
              console.warn(`[ShippingService] OSRM ⚠️ "${store.store_name}": OSRM=${(osrmDistance / 1000).toFixed(2)}km exceeds 2.5×straight-line(${(straightLine / 1000).toFixed(2)}km). Using Haversine=${(haversineDist / 1000).toFixed(2)}km instead.`);
              if (haversineDist < minDistanceMeters) {
                minDistanceMeters = haversineDist;
                closestStore = store;
                finalDurationSeconds = Math.round(haversineDist / 8.33);
              }
              continue;
            }
          }
        }
        console.warn(`[ShippingService] OSRM route request failed for store "${store.store_name}", falling back to Haversine`);
      } catch (err: any) {
        console.warn(`[ShippingService] OSRM routing error for store "${store.store_name}": ${err.message}. Falling back to Haversine.`);
      }

      // 3. Fallback: Haversine distance * 1.35 road factor
      const haversineDist = getHaversineDistance(lat, lon, storeLat, storeLon, true);
      console.log(`[ShippingService] Haversine fallback to "${store.store_name}": ${(haversineDist / 1000).toFixed(2)} km`);

      if (haversineDist < minDistanceMeters) {
        minDistanceMeters = haversineDist;
        closestStore = store;
        // Approximate duration: 30 km/h average speed (8.33 m/s)
        finalDurationSeconds = Math.round(haversineDist / 8.33);
      }
    }

    if (!closestStore) {
      throw new Error('Failed to resolve closest store');
    }

    // 4. Calculate tiered shipping fee
    const shippingFee = calculateTieredShippingFee(minDistanceMeters);

    return {
      store_id: closestStore.store_id,
      store_name: closestStore.store_name,
      address: closestStore.address,
      latitude: Number(closestStore.latitude),
      longitude: Number(closestStore.longitude),
      distance_meters: Math.round(minDistanceMeters),
      duration_seconds: finalDurationSeconds,
      shipping_fee: shippingFee,
      used_osrm: usedOSRM,
    };
  }
}

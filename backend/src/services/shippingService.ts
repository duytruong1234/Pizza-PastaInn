import prisma from '../lib/prisma';

// Tính khoảng cách đường chim bay Haversine (đơn vị: mét)
// Khi useRoadFactor = true, nhân hệ số đường bộ đô thị Việt Nam (1.2x - 1.32x)
export function getHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  useRoadFactor = true
): number {
  const R = 6371e3; // Bán kính Trái Đất (mét)
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const straightLine = R * c;
  if (!useRoadFactor) return straightLine;

  const factor = straightLine < 1000 ? 1.2 : 1.32;
  return straightLine * factor;
}

// Chính sách phí giao hàng của Pizza & Pasta Inn:
// - Bán kính <= 4km (4000m): Miễn phí (0đ)
// - Bán kính > 4km (> 4000m): Đồng giá 20.000đ
export function calculateTieredShippingFee(distanceMeters: number): number {
  return distanceMeters > 4000 ? 20000 : 0;
}

// Bảng tọa độ tâm (centroid) dự phòng cho các Phường/Quận phổ biến tại TP.HCM và các Tỉnh/TP
// Đảm bảo luôn tính được khoảng cách & phí ship ngay cả khi dịch vụ bản đồ bên ngoài chậm
const VN_AREA_COORDS_FALLBACK: Array<{ keywords: string[]; lat: number; lon: number; label: string }> = [
  // Khu vực Quận 5 & lân cận
  { keywords: ['an đông', 'an dong', 'đào tấn', 'dao tan', 'trần phú', 'tran phu'], lat: 10.7552, lon: 106.6665, label: 'Phường An Đông, TP.HCM' },
  { keywords: ['chợ quán', 'cho quan', 'nguyễn trãi', 'nguyen trai', 'trần bình trọng'], lat: 10.7568, lon: 106.6782, label: 'Phường Chợ Quán, TP.HCM' },
  { keywords: ['chợ lớn', 'cho lon', 'hải thượng lãn ông', 'châu văn liêm', 'quận 5', 'quan 5'], lat: 10.7524, lon: 106.6585, label: 'Khu vực Quận 5, TP.HCM' },
  // Khu vực Quận 7 & lân cận
  { keywords: ['tân hưng', 'tan hung', 'phạm thái bường', 'nguyễn hữu thọ', 'him lam'], lat: 10.7392, lon: 106.7015, label: 'Phường Tân Hưng, TP.HCM' },
  { keywords: ['tân phong', 'tan phong', 'phú mỹ hưng', 'nguyễn văn linh', 'quận 7', 'quan 7'], lat: 10.7295, lon: 106.7058, label: 'Phường Tân Phong, TP.HCM' },
  { keywords: ['tân phú', 'phú mỹ', 'phu my', 'huỳnh tấn phát', 'tân thuận', 'tan thuan'], lat: 10.7320, lon: 106.7265, label: 'Khu vực Quận 7, TP.HCM' },
  // Khu vực Quận 1, Quận 3, Quận 4, Quận 8, Quận 10, Quận 11
  { keywords: ['bến nghé', 'ben nghe', 'bến thành', 'ben thanh', 'sài gòn', 'sai gon', 'tân định', 'cầu ông lãnh', 'quận 1', 'quan 1'], lat: 10.7756, lon: 106.7004, label: 'Trung tâm Quận 1, TP.HCM' },
  { keywords: ['võ thị sáu', 'bàn cờ', 'ban co', 'xuân hòa', 'xuan hoa', 'nhiêu lộc', 'quận 3', 'quan 3'], lat: 10.7812, lon: 106.6865, label: 'Khu vực Quận 3, TP.HCM' },
  { keywords: ['vĩnh hội', 'vinh hoi', 'khánh hội', 'khanh hoi', 'xóm chiếu', 'quận 4', 'quan 4'], lat: 10.7595, lon: 106.7038, label: 'Khu vực Quận 4, TP.HCM' },
  { keywords: ['diên hồng', 'dien hong', 'vườn lài', 'vuon lai', 'hòa hưng', 'hoa hung', 'sư vạn hạnh', 'quận 10', 'quan 10'], lat: 10.7725, lon: 106.6678, label: 'Khu vực Quận 10, TP.HCM' },
  { keywords: ['hòa bình', 'hoa binh', 'phú thọ', 'phu tho', 'bình thới', 'minh phụng', 'quận 11', 'quan 11'], lat: 10.7642, lon: 106.6502, label: 'Khu vực Quận 11, TP.HCM' },
  { keywords: ['chánh hưng', 'chanh hung', 'phú định', 'bình đông', 'phạm thế hiển', 'quận 8', 'quan 8'], lat: 10.7378, lon: 106.6625, label: 'Khu vực Quận 8, TP.HCM' },
  { keywords: ['bình tây', 'binh tay', 'bình tiên', 'bình phú', 'phú lâm', 'quận 6', 'quan 6'], lat: 10.7465, lon: 106.6352, label: 'Khu vực Quận 6, TP.HCM' },
  // Các quận khác tại TP.HCM
  { keywords: ['bình thạnh', 'binh thanh', 'gia định', 'thạnh mỹ tây', 'bình lợi'], lat: 10.8045, lon: 106.7085, label: 'Khu vực Bình Thạnh, TP.HCM' },
  { keywords: ['phú nhuận', 'phu nhuan', 'cầu kiệu', 'đức nhuận'], lat: 10.7992, lon: 106.6805, label: 'Khu vực Phú Nhuận, TP.HCM' },
  { keywords: ['tân bình', 'tan binh', 'tân sơn', 'bảy hiền', 'cộng hòa'], lat: 10.8015, lon: 106.6525, label: 'Khu vực Tân Bình, TP.HCM' },
  { keywords: ['gò vấp', 'go vap', 'hạnh thông', 'thông tây hội', 'quang trung'], lat: 10.8385, lon: 106.6652, label: 'Khu vực Gò Vấp, TP.HCM' },
  { keywords: ['thủ đức', 'thu duc', 'hiệp bình', 'linh xuân', 'thảo điền', 'an khánh'], lat: 10.8255, lon: 106.7555, label: 'Khu vực Thủ Đức, TP.HCM' },
  { keywords: ['bình tân', 'binh tan', 'an lạc', 'bình trị đông', 'tên lửa'], lat: 10.7655, lon: 106.6035, label: 'Khu vực Bình Tân, TP.HCM' },
  { keywords: ['nhà bè', 'nha be', 'phước kiển', 'hiệp phước'], lat: 10.6952, lon: 106.7045, label: 'Khu vực Nhà Bè, TP.HCM' },
  { keywords: ['bình chánh', 'binh chanh', 'trung sơn', 'bình hưng'], lat: 10.7265, lon: 106.6855, label: 'Khu vực Bình Chánh, TP.HCM' },
  { keywords: ['quận 12', 'quan 12', 'hóc môn', 'hoc mon', 'củ chi'], lat: 10.8635, lon: 106.6542, label: 'Khu vực ngoại thành TP.HCM' },
  { keywords: ['hồ chí minh', 'ho chi minh', 'tphcm', 'tp.hcm'], lat: 10.7626, lon: 106.6822, label: 'TP. Hồ Chí Minh' },
  // Tỉnh/TP khác
  { keywords: ['hà nội', 'ha noi'], lat: 21.0285, lon: 105.8542, label: 'Hà Nội' },
  { keywords: ['đà nẵng', 'da nang'], lat: 16.0544, lon: 108.2022, label: 'Đà Nẵng' },
  { keywords: ['bình dương', 'binh duong', 'dĩ an', 'thuận an', 'thủ dầu một'], lat: 10.9065, lon: 106.7425, label: 'Bình Dương' },
  { keywords: ['đồng nai', 'dong nai', 'biên hòa'], lat: 10.9574, lon: 106.8426, label: 'Đồng Nai' },
  { keywords: ['cần thơ', 'can tho'], lat: 10.0452, lon: 105.7469, label: 'Cần Thơ' },
];

function cleanAddressForGeocoding(address: string): string {
  if (!address) return '';
  let cleaned = address;
  cleaned = cleaned.replace(/\(\d[\d\s\-\.]{6,}\)/g, '');
  cleaned = cleaned.replace(/\b0\d{9,}\b/g, '');
  cleaned = cleaned.replace(/Thành phố Hồ Chí Minh/gi, 'Hồ Chí Minh');
  cleaned = cleaned.replace(/TP\.\s*Hồ Chí Minh/gi, 'Hồ Chí Minh');
  cleaned = cleaned.replace(/TP\.?\s*HCM/gi, 'Hồ Chí Minh');
  return cleaned.trim();
}

function matchFallbackCoords(query: string): { lat: number; lon: number; label: string } | null {
  const normalized = query.toLowerCase();
  for (const item of VN_AREA_COORDS_FALLBACK) {
    if (item.keywords.some((kw) => normalized.includes(kw))) {
      return { lat: item.lat, lon: item.lon, label: item.label };
    }
  }
  return null;
}

function formatStoreDisplayName(store: { store_name?: string | null; address?: string | null }): string {
  const baseName = (store.store_name || 'Pizza & Pasta Inn').trim();
  const addr = (store.address || '').trim();
  if (!addr) return baseName;
  const shortAddr = addr
    .split(',')
    .slice(0, 2)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');
  if (!shortAddr || baseName.toLowerCase().includes(shortAddr.toLowerCase())) {
    return baseName;
  }
  return `${baseName} (${shortAddr})`;
}

export class ShippingService {
  /**
   * Geocode địa chỉ sang danh sách tọa độ (MapTiler -> Nominatim -> Fallback nội bộ)
   */
  static async geocodeAddress(query: string) {
    const cleaned = cleanAddressForGeocoding(query);
    if (!cleaned) return [];

    // 1. Nếu có cấu hình MAPTILER_API_KEY thì thử MapTiler trước
    const apiKey = process.env.MAPTILER_API_KEY;
    if (apiKey) {
      try {
        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(cleaned)}.json?key=${apiKey}&country=vn&limit=5&language=vi`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (Array.isArray(data.features) && data.features.length > 0) {
            return data.features;
          }
        }
      } catch {
        // Chuyển sang Nominatim nếu MapTiler lỗi
      }
    }

    // 2. Tìm kiếm qua OpenStreetMap Nominatim với chiến lược rút gọn từng phần địa chỉ
    const parts = cleaned
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const candidateQueries: string[] = [cleaned];
    if (parts.length >= 2) {
      // Bỏ phần số nhà/ngõ hẻm quá chi tiết ở đầu nếu Nominatim chưa nhận diện được
      const withoutAlley = parts[0].replace(/^\d+[A-Za-z0-9\/\-]*\s+/, '').trim();
      if (withoutAlley && withoutAlley !== parts[0]) {
        candidateQueries.push([withoutAlley, ...parts.slice(1)].join(', '));
      }
      candidateQueries.push(parts.slice(1).join(', '));
    }

    for (const qText of candidateQueries) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          qText
        )}&countrycodes=vn&limit=3&accept-language=vi`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(url, {
          headers: { 'User-Agent': 'PizzaPastaInn-ShippingService/1.0' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const rows = (await res.json()) as any[];
          if (Array.isArray(rows) && rows.length > 0) {
            return rows.map((r) => ({
              place_name: r.display_name || qText,
              text: r.name || qText,
              center: [Number(r.lon), Number(r.lat)],
              geometry: {
                type: 'Point',
                coordinates: [Number(r.lon), Number(r.lat)],
              },
            }));
          }
        }
      } catch {
        // Thử tiếp câu truy vấn rút gọn tiếp theo
      }
    }

    // 3. Fallback nội bộ theo từ khóa Phường / Quận / Thành phố
    const fb = matchFallbackCoords(cleaned);
    if (fb) {
      return [
        {
          place_name: `${cleaned} (${fb.label})`,
          text: fb.label,
          center: [fb.lon, fb.lat],
          geometry: {
            type: 'Point',
            coordinates: [fb.lon, fb.lat],
          },
        },
      ];
    }

    return [];
  }

  /**
   * Tính chi nhánh gần nhất, khoảng cách giao hàng (mét) và phí giao hàng (0đ hoặc 20.000đ)
   */
  static async calculateShipping(
    lat?: number | null,
    lon?: number | null,
    address?: string | null
  ) {
    let resolvedLat = lat != null && !isNaN(Number(lat)) ? Number(lat) : null;
    let resolvedLon = lon != null && !isNaN(Number(lon)) ? Number(lon) : null;

    // Nếu chưa có tọa độ nhưng có chuỗi địa chỉ, tự động geocode ngay tại backend
    if ((resolvedLat == null || resolvedLon == null) && address && address.trim()) {
      const features = await ShippingService.geocodeAddress(address);
      if (features.length > 0) {
        const first = features[0];
        const fLon = first.geometry?.coordinates?.[0] ?? first.center?.[0];
        const fLat = first.geometry?.coordinates?.[1] ?? first.center?.[1];
        if (fLat != null && fLon != null && !isNaN(Number(fLat)) && !isNaN(Number(fLon))) {
          resolvedLat = Number(fLat);
          resolvedLon = Number(fLon);
        }
      }
    }

    // Lấy danh sách chi nhánh đang hoạt động (có fallback an toàn nếu chưa cấu hình tọa độ chi nhánh)
    let stores: Array<{
      store_id: number | null;
      store_name: string | null;
      address: string | null;
      latitude: any;
      longitude: any;
    }> = [];
    try {
      stores = await prisma.store.findMany({
        where: { is_active: true },
      });
    } catch {
      stores = [];
    }

    let validStores = stores.filter((store) => {
      if (!store.latitude || !store.longitude) return false;
      const storeLat = Number(store.latitude);
      const storeLon = Number(store.longitude);
      return !isNaN(storeLat) && !isNaN(storeLon);
    });

    if (validStores.length === 0) {
      validStores = [
        {
          store_id: stores[0]?.store_id ?? null,
          store_name: stores[0]?.store_name || 'Pizza & Pasta Inn - Chi nhánh trung tâm',
          address: stores[0]?.address || 'Quận 1, TP. Hồ Chí Minh',
          latitude: 10.7769,
          longitude: 106.7009,
        },
      ];
    }

    // Nếu vẫn không xác định được tọa độ khách hàng, chọn chi nhánh đầu tiên và miễn phí ship mặc định
    if (resolvedLat == null || resolvedLon == null) {
      const defaultStore = validStores[0];
      return {
        store_id: defaultStore.store_id,
        store_name: formatStoreDisplayName(defaultStore),
        address: defaultStore.address || '',
        latitude: Number(defaultStore.latitude),
        longitude: Number(defaultStore.longitude),
        customer_latitude: null,
        customer_longitude: null,
        distance_meters: 2500,
        distance_km: 2.5,
        duration_seconds: 600,
        shipping_fee: 0,
        used_osrm: false,
      };
    }

    let closestStore = validStores[0];
    let minDistanceMeters = Infinity;
    let finalDurationSeconds = 0;
    let usedOSRM = false;

    for (const store of validStores) {
      const storeLat = Number(store.latitude);
      const storeLon = Number(store.longitude);

      try {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${resolvedLon},${resolvedLat};${storeLon},${storeLat}?overview=false`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(osrmUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = (await res.json()) as any;
          if (data.routes && data.routes.length > 0) {
            const osrmDistance = Number(data.routes[0].distance);
            const duration = Number(data.routes[0].duration);
            const straightLine = getHaversineDistance(resolvedLat, resolvedLon, storeLat, storeLon, false);

            if (osrmDistance <= straightLine * 2.5) {
              if (osrmDistance < minDistanceMeters) {
                minDistanceMeters = osrmDistance;
                closestStore = store;
                finalDurationSeconds = Math.round(duration);
                usedOSRM = true;
              }
              continue;
            }
          }
        }
      } catch {
        // Fallback sang Haversine nếu OSRM quá thời gian chờ
      }

      const haversineDist = getHaversineDistance(resolvedLat, resolvedLon, storeLat, storeLon, true);
      if (haversineDist < minDistanceMeters) {
        minDistanceMeters = haversineDist;
        closestStore = store;
        finalDurationSeconds = Math.round(haversineDist / 8.33);
      }
    }

    const roundedMeters = Math.round(minDistanceMeters);
    const shippingFee = calculateTieredShippingFee(roundedMeters);

    return {
      store_id: closestStore.store_id,
      store_name: formatStoreDisplayName(closestStore),
      address: closestStore.address || '',
      latitude: Number(closestStore.latitude),
      longitude: Number(closestStore.longitude),
      customer_latitude: resolvedLat,
      customer_longitude: resolvedLon,
      distance_meters: roundedMeters,
      distance_km: Number((roundedMeters / 1000).toFixed(1)),
      duration_seconds: finalDurationSeconds,
      shipping_fee: shippingFee,
      used_osrm: usedOSRM,
    };
  }
}

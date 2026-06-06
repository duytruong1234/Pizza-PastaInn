// Component chọn địa chỉ Việt Nam sau sáp nhập 2025 — 2 cấp: Tỉnh/TP → Phường/Xã
// Dữ liệu từ API v2: https://provinces.open-api.vn/api/v2/
"use client";

import { useEffect, useState, useCallback } from "react";

const API_BASE = "https://provinces.open-api.vn/api/v2";

interface Province {
  code: number;
  name: string;
}

interface Ward {
  code: number;
  name: string;
}

interface AddressPickerVNProps {
  /** Giá trị ban đầu để parse khi sửa (dạng: "Số nhà, Phường, Tỉnh") */
  initialAddress?: string;
  /** Callback trả về địa chỉ đầy đủ đã ghép */
  onChange: (fullAddress: string) => void;
  /** Hiển thị lỗi */
  error?: string;
}

// Select styled theo design system
function StyledSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  loading,
  disabled,
  error,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  loading?: boolean;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-body-sm font-medium text-dark dark:text-white">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          className={`w-full appearance-none rounded-lg border bg-transparent px-4 py-3 pr-10 outline-none transition
            ${error ? "border-red-500 dark:border-red-500" : "border-stroke dark:border-dark-3"}
            ${value ? "text-dark dark:text-white" : "text-gray-400 dark:text-gray-500"}
            focus:border-primary dark:bg-dark-2 dark:focus:border-primary
            disabled:cursor-not-allowed disabled:opacity-60
            [&>option]:text-dark-5 dark:[&>option]:text-dark-6`}
        >
          <option value="">
            {loading ? "Loading..." : placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Chevron / loading icon */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5 text-gray-400">
              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function AddressPickerVN({ initialAddress, onChange, error }: AddressPickerVNProps) {
  // Data lists
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Selected values
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Track nếu đã init xong (để không gọi onChange khi init)
  const [initialized, setInitialized] = useState(false);

  // --- Fetch Provinces ---
  useEffect(() => {
    setLoadingProvinces(true);
    fetch(`${API_BASE}/p/`)
      .then((res) => res.json())
      .then((data: Province[]) => setProvinces(data))
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // --- Fetch Wards khi chọn Tỉnh ---
  useEffect(() => {
    if (!selectedProvince) {
      setWards([]);
      setSelectedWard("");
      return;
    }
    setLoadingWards(true);
    setWards([]);
    setSelectedWard("");
    fetch(`${API_BASE}/p/${selectedProvince}?depth=2`)
      .then((res) => res.json())
      .then((data) => setWards(data.wards || []))
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
  }, [selectedProvince]);

  // --- Compose full address & callback ---
  const composeAddress = useCallback(() => {
    const parts: string[] = [];
    if (addressDetail.trim()) parts.push(addressDetail.trim());
    if (selectedWard) {
      const ward = wards.find((w) => String(w.code) === selectedWard);
      if (ward) parts.push(ward.name);
    }
    if (selectedProvince) {
      const prov = provinces.find((p) => String(p.code) === selectedProvince);
      if (prov) parts.push(prov.name);
    }
    return parts.join(", ");
  }, [addressDetail, selectedWard, selectedProvince, wards, provinces]);

  useEffect(() => {
    if (!initialized) return;
    onChange(composeAddress());
  }, [composeAddress, initialized, onChange]);

  // --- Parse initial address (khi sửa) ---
  useEffect(() => {
    if (!initialAddress || provinces.length === 0) {
      if (provinces.length > 0 && !initialAddress) setInitialized(true);
      return;
    }

    // Tách: "detail, ward, province"
    const parts = initialAddress.split(",").map((s) => s.trim());
    if (parts.length === 0) { setInitialized(true); return; }

    const normalizeName = (name: string) => {
      return name
        .toLowerCase()
        .replace(/^(thành phố|tỉnh|tp\.?|t\.)\s+/gi, "")
        .replace(/^(phường|xã|thị trấn|thị xã|p\.?|x\.?)\s+/gi, "")
        .trim();
    };

    const matchProvince = (name: string) =>
      provinces.find((p) => normalizeName(p.name) === normalizeName(name));

    // Thử match tỉnh từ phần tử cuối
    for (let i = parts.length - 1; i >= 0; i--) {
      const provinceMatch = matchProvince(parts[i]);
      if (provinceMatch) {
        const wardName = i - 1 >= 0 ? parts[i - 1] : "";
        const detail = parts.slice(0, Math.max(0, i - 1)).join(", ");

        setSelectedProvince(String(provinceMatch.code));
        if (detail) setAddressDetail(detail);

        // Fetch wards rồi match
        fetch(`${API_BASE}/p/${provinceMatch.code}?depth=2`)
          .then((r) => r.json())
          .then((data) => {
            const ws: Ward[] = data.wards || [];
            setWards(ws);
            const wardMatch = ws.find((w) => normalizeName(w.name) === normalizeName(wardName));
            if (wardMatch) {
              setSelectedWard(String(wardMatch.code));
            } else if (wardName) {
              // Không match phường → gộp vào detail
              setAddressDetail(parts.slice(0, i).join(", "));
            }
            setInitialized(true);
          })
          .catch(() => setInitialized(true));
        return;
      }
    }

    // Không match tỉnh nào → gộp tất cả vào addressDetail
    setAddressDetail(initialAddress);
    setInitialized(true);
  }, [initialAddress, provinces]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StyledSelect
          label="PROVINCE / CITY (*)"
          value={selectedProvince}
          onChange={(val) => { setSelectedProvince(val); setInitialized(true); }}
          options={provinces.map((p) => ({ value: String(p.code), label: p.name }))}
          placeholder="Select Province/City"
          loading={loadingProvinces}
          error={error && !selectedProvince ? " " : undefined}
        />
        <StyledSelect
          label="WARD / COMMUNE (*)"
          value={selectedWard}
          onChange={(val) => { setSelectedWard(val); setInitialized(true); }}
          options={wards.map((w) => ({ value: String(w.code), label: w.name }))}
          placeholder="Select Ward/Commune"
          loading={loadingWards}
          disabled={!selectedProvince}
          error={error && selectedProvince && !selectedWard ? " " : undefined}
        />
      </div>

      {/* Số nhà, tên đường */}
      <div className="space-y-2">
        <label className="block text-body-sm font-medium text-dark dark:text-white">
          STREET ADDRESS (House number, street name...) (*)
        </label>
        <input
          type="text"
          placeholder="Enter street address"
          value={addressDetail}
          onChange={(e) => { setAddressDetail(e.target.value); setInitialized(true); }}
          className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary"
        />
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}

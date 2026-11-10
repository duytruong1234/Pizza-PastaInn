// Component chọn địa chỉ Việt Nam dạng dropdown cho Frontend Checkout — 2 cấp: Tỉnh/TP → Phường/Xã
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Loader, MapPin } from "lucide-react";
import { useUI } from "@/components/UIProvider";

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
  initialAddress?: string;
  onChange: (fullAddress: string) => void;
  onSearchOnMap?: (fullAddress: string) => void;
  onSelectCoordinates?: (lat: number, lon: number, address: string) => void;
  loadingGeocode?: boolean;
}

export default function AddressPickerVN({
  initialAddress,
  onChange,
  onSearchOnMap,
  onSelectCoordinates,
  loadingGeocode = false,
}: AddressPickerVNProps) {
  const { theme, lang } = useUI();
  const isLight = theme === "light";

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedWard, setSelectedWard] = useState("");
  const [addressDetail, setAddressDetail] = useState("");

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const lastSentAddressRef = useRef(initialAddress || "");
  const lastParsedAddressRef = useRef(initialAddress || "");
  const isUserChangeRef = useRef(false);



  const [provinceSearch, setProvinceSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const [showProvinceDropdown, setShowProvinceDropdown] = useState(false);
  const [showWardDropdown, setShowWardDropdown] = useState(false);

  const handleAddressDetailChange = (val: string) => {
    isUserChangeRef.current = true;
    setAddressDetail(val);
    setInitialized(true);
  };

  // --- Fetch Tỉnh/Thành phố ---
  useEffect(() => {
    setLoadingProvinces(true);
    fetch(`${API_BASE}/p/`)
      .then((res) => res.json())
      .then((data: Province[]) => setProvinces(data))
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  // --- Fetch Phường/Xã khi Tỉnh/Thành phố thay đổi ---
  useEffect(() => {
    if (!selectedProvince) {
      setWards([]);
      setSelectedWard("");
      return;
    }
    setLoadingWards(true);
    setWards([]);
    setSelectedWard("");
    fetch(`${API_BASE}/w/?province=${selectedProvince}`)
      .then((res) => res.json())
      .then((data) => {
        const wsList: Ward[] = [];
        if (data && Array.isArray(data)) {
          data.forEach((w: any) => {
            wsList.push({
              code: w.code,
              name: w.name
            });
          });
        }
        setWards(wsList);
      })
      .catch(() => setWards([]))
      .finally(() => setLoadingWards(false));
  }, [selectedProvince]);

  // Đồng bộ ô tìm kiếm Tỉnh/Thành phố khi thay đổi từ nguồn khác
  useEffect(() => {
    const prov = provinces.find((p) => String(p.code) === selectedProvince);
    setProvinceSearch(prov ? prov.name : "");
  }, [selectedProvince, provinces]);

  // Đồng bộ ô tìm kiếm Phường/Xã khi thay đổi từ nguồn khác
  useEffect(() => {
    const wd = wards.find((w) => String(w.code) === selectedWard);
    setWardSearch(wd ? wd.name : "");
  }, [selectedWard, wards]);

  // --- Ghép địa chỉ đầy đủ ---
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

  // --- Kích hoạt callback onChange khi thông tin thay đổi ---
  useEffect(() => {
    if (!initialized) return;
    if (!isUserChangeRef.current) return;
    const currentComposed = composeAddress();
    // Ngăn chặn gọi trùng lặp nếu địa chỉ giống hệt lần gửi trước
    if (currentComposed === lastSentAddressRef.current) return;
    lastSentAddressRef.current = currentComposed;
    isUserChangeRef.current = false;
    onChange(currentComposed);
  }, [composeAddress, initialized, onChange]);

  // --- Parse địa chỉ ban đầu hoặc địa chỉ cập nhật từ ngoài (bản đồ) ---
  useEffect(() => {
    if (provinces.length === 0) return;

    // Nếu địa chỉ trùng với địa chỉ đã parse trước đó, không cần parse lại
    if (initialAddress === lastParsedAddressRef.current) {
      return;
    }

    // Nếu địa chỉ trùng với địa chỉ vừa gửi đi, không cần parse lại
    if (initialAddress === lastSentAddressRef.current) {
      lastParsedAddressRef.current = initialAddress || "";
      if (!initialized) setInitialized(true);
      return;
    }

    lastParsedAddressRef.current = initialAddress || "";

    if (!initialAddress) {
      setSelectedProvince("");
      setSelectedWard("");
      setAddressDetail("");
      lastSentAddressRef.current = "";
      setInitialized(true);
      return;
    }

    const parts = initialAddress.split(",").map((s) => s.trim());
    const matchProvince = (name: string) =>
      provinces.find(
        (p) =>
          p.name.toLowerCase() === name.toLowerCase() ||
          p.name.toLowerCase().replace(/tỉnh\s+|thành\s+phố\s+/g, "") ===
          name.toLowerCase().replace(/tỉnh\s+|thành\s+phố\s+/g, "")
      );

    for (let i = parts.length - 1; i >= 0; i--) {
      const provinceMatch = matchProvince(parts[i]);
      if (provinceMatch) {
        const wardName = i - 1 >= 0 ? parts[i - 1] : "";
        const compoundWardName = (i - 2 >= 0) ? `${parts[i - 2]}, ${parts[i - 1]}` : "";
        const detail = parts.slice(0, Math.max(0, i - 1)).join(", ");

        setSelectedProvince(String(provinceMatch.code));
        if (detail) setAddressDetail(detail);

        fetch(`${API_BASE}/w/?province=${provinceMatch.code}`)
          .then((r) => r.json())
          .then((data) => {
            const wsList: Ward[] = [];
            if (data && Array.isArray(data)) {
              data.forEach((w: any) => {
                wsList.push({
                  code: w.code,
                  name: w.name
                });
              });
            }
            setWards(wsList);
            const wardMatch = wsList.find(
              (w) => {
                const nameLower = w.name.toLowerCase();
                const cleanName = nameLower.replace(/phường\s+|xã\s+|thị\s+trấn\s+/g, "").trim();
                
                const checkMatch = (str: string) => {
                  if (!str) return false;
                  const strLower = str.toLowerCase();
                  const cleanStr = strLower.replace(/phường\s+|xã\s+|thị\s+trấn\s+/g, "").trim();
                  return (
                    nameLower === strLower ||
                    cleanName === cleanStr ||
                    (cleanName.length > 2 && cleanStr.length > 2 && (cleanName.startsWith(cleanStr) || cleanStr.startsWith(cleanName)))
                  );
                };

                return checkMatch(wardName) || (i - 2 >= 0 && checkMatch(parts[i - 2]));
              }
            );

            if (wardMatch) {
              setSelectedWard(String(wardMatch.code));
              const checkMatch = (str: string) => {
                if (!str) return false;
                const strLower = str.toLowerCase();
                const cleanStr = strLower.replace(/phường\s+|xã\s+|thị\s+trấn\s+/g, "").trim();
                return (
                  wardMatch.name.toLowerCase() === strLower ||
                  wardMatch.name.toLowerCase().replace(/phường\s+|xã\s+|thị\s+trấn\s+/g, "").trim() === cleanStr ||
                  (cleanStr.length > 2 && (wardMatch.name.toLowerCase().replace(/phường\s+|xã\s+|thị\s+trấn\s+/g, "").trim().startsWith(cleanStr) || cleanStr.startsWith(wardMatch.name.toLowerCase().replace(/phường\s+|xã\s+|thị\s+trấn\s+/g, "").trim())))
                );
              };

              const matchedIndex = (i - 2 >= 0 && checkMatch(parts[i - 2])) ? (i - 2) : (i - 1);
              const realDetail = parts.slice(0, Math.max(0, matchedIndex)).join(", ");
              setAddressDetail(realDetail);
            } else if (wardName) {
              setAddressDetail(parts.slice(0, i).join(", "));
            }
            lastSentAddressRef.current = initialAddress || "";
            setInitialized(true);
          })
          .catch(() => setInitialized(true));
        return;
      }
    }

    setAddressDetail(initialAddress || "");
    lastSentAddressRef.current = initialAddress || "";
    setInitialized(true);
  }, [initialAddress, provinces]);

  const handleSearchClick = () => {
    const full = composeAddress();
    if (full.trim() && onSearchOnMap) {
      onSearchOnMap(full);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchClick();
    }
  };

  const labelClass = `text-[12px] font-semibold tracking-wider uppercase ${
    isLight ? "text-[#5c4d3c]" : "text-white/60"
  }`;

  const inputClass = `w-full rounded-[10px] py-2.5 px-4 pr-10 text-[14px] outline-none transition-all duration-200 border disabled:cursor-not-allowed ${
    isLight
      ? "bg-[#fcfaf6] border-black/15 text-[#1c1208] placeholder:text-[#9a8c7a] focus:border-[#cd3645] focus:ring-2 focus:ring-[#cd3645]/15 focus:bg-white disabled:opacity-50"
      : "bg-white/[0.06] border-white/10 text-white placeholder:text-white/30 focus:border-[#d4a017] focus:ring-2 focus:ring-[#d4a017]/15 disabled:opacity-50"
  }`;

  const dropdownMenuClass = `absolute left-0 right-0 mt-1 rounded-[10px] border z-[100] max-h-[220px] overflow-y-auto custom-scrollbar ${
    isLight
      ? "bg-white border-black/12 shadow-[0_12px_30px_rgba(28,18,8,0.12)]"
      : "bg-[#161616] border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
  }`;

  const dropdownItemClass = `w-full text-left px-4 py-2 transition-colors text-[13.5px] border-b last:border-b-0 ${
    isLight
      ? "text-[#1c1208] border-black/5 hover:bg-[#cd3645]/10"
      : "text-white border-white/5 hover:bg-[#d4a017]/10"
  }`;

  return (
    <div className="space-y-3.5">
      {/* Hàng chọn Tỉnh/Thành phố & Phường/Xã */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Dropdown Tỉnh/Thành phố */}
        <div className="space-y-1.5">
          <label className={labelClass}>
            {lang === "en" ? "Province / City (*)" : "Tỉnh / Thành phố (*)"}
          </label>
          <div className="relative">
            <input
              type="text"
              value={provinceSearch}
              onChange={(e) => {
                setProvinceSearch(e.target.value);
                setShowProvinceDropdown(true);
                setInitialized(true);
              }}
              onFocus={() => setShowProvinceDropdown(true)}
              onBlur={() => {
                setTimeout(() => {
                  setShowProvinceDropdown(false);
                  const prov = provinces.find((p) => String(p.code) === selectedProvince);
                  setProvinceSearch(prov ? prov.name : "");
                }, 250);
              }}
              placeholder={
                loadingProvinces
                  ? lang === "en" ? "Loading..." : "Đang tải danh sách..."
                  : lang === "en" ? "Type or select Province/City" : "Nhập hoặc chọn Tỉnh/Thành phố"
              }
              disabled={loadingProvinces}
              className={inputClass}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {loadingProvinces ? (
                <Loader size={16} className="animate-spin text-[#d4a017]" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-5 h-5 ${isLight ? "text-[#8c7d6b]" : "text-white/30"}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            {/* Province Search Results Dropdown */}
            {showProvinceDropdown && (
              <div className={dropdownMenuClass}>
                {provinces
                  .filter((p) => p.name.toLowerCase().includes(provinceSearch.toLowerCase()))
                  .map((p) => (
                    <button
                      key={p.code}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        isUserChangeRef.current = true;
                        setSelectedProvince(String(p.code));
                        setProvinceSearch(p.name);
                        setShowProvinceDropdown(false);
                        setInitialized(true);
                      }}
                      className={dropdownItemClass}
                    >
                      {p.name}
                    </button>
                  ))}
                {provinces.filter((p) => p.name.toLowerCase().includes(provinceSearch.toLowerCase())).length === 0 && (
                  <div className={`px-4 py-2.5 text-[13px] text-center ${isLight ? "text-[#8c7d6b]" : "text-white/30"}`}>
                    {lang === "en" ? "No results found" : "Không tìm thấy kết quả"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dropdown Phường/Xã */}
        <div className="space-y-1.5">
          <label className={labelClass}>
            {lang === "en" ? "Ward / Commune (*)" : "Phường / Xã (*)"}
          </label>
          <div className="relative">
            <input
              type="text"
              value={wardSearch}
              onChange={(e) => {
                setWardSearch(e.target.value);
                setShowWardDropdown(true);
                setInitialized(true);
              }}
              onFocus={() => {
                if (selectedProvince) setShowWardDropdown(true);
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowWardDropdown(false);
                  const wd = wards.find((w) => String(w.code) === selectedWard);
                  setWardSearch(wd ? wd.name : "");
                }, 250);
              }}
              placeholder={
                loadingWards
                  ? lang === "en" ? "Loading..." : "Đang tải danh sách..."
                  : !selectedProvince
                    ? lang === "en" ? "Select Province/City first" : "Vui lòng chọn Tỉnh/Thành phố trước"
                    : lang === "en" ? "Type or select Ward/Commune" : "Nhập hoặc chọn Phường/Xã"
              }
              disabled={loadingWards || !selectedProvince}
              className={inputClass}
            />
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              {loadingWards ? (
                <Loader size={16} className="animate-spin text-[#d4a017]" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-5 h-5 ${isLight ? "text-[#8c7d6b]" : "text-white/30"}`}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            {/* Ward Search Results Dropdown */}
            {showWardDropdown && selectedProvince && (
              <div className={dropdownMenuClass}>
                {wards
                  .filter((w) => w.name.toLowerCase().includes(wardSearch.toLowerCase()))
                  .map((w) => (
                    <button
                      key={w.code}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        isUserChangeRef.current = true;
                        setSelectedWard(String(w.code));
                        setWardSearch(w.name);
                        setShowWardDropdown(false);
                        setInitialized(true);
                      }}
                      className={dropdownItemClass}
                    >
                      {w.name}
                    </button>
                  ))}
                {wards.filter((w) => w.name.toLowerCase().includes(wardSearch.toLowerCase())).length === 0 && (
                  <div className={`px-4 py-2.5 text-[13px] text-center ${isLight ? "text-[#8c7d6b]" : "text-white/30"}`}>
                    {lang === "en" ? "No results found" : "Không tìm thấy kết quả"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input Số nhà, tên đường */}
      <div className="space-y-1.5 relative">
        <label className={labelClass}>
          {lang === "en" ? "Street Address (*)" : "Số nhà, tên đường (*)"}
        </label>
        <div className="relative w-full">
          <MapPin
            size={16}
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isLight ? "text-[#8c7d6b]" : "text-white/30"
            }`}
          />
          <input
            type="text"
            placeholder={lang === "en" ? "Enter house number, alley, street name..." : "Nhập số nhà, ngõ/hẻm, tên đường..."}
            value={addressDetail}
            onChange={(e) => handleAddressDetailChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${inputClass} pl-9 pr-4`}
          />
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";

interface DishOption {
  value: string;
  label: string;
  data: {
    dish_name: string;
    image: string | null;
    size: string | null;
    crust: string | null;
    category_name: string | null;
  };
}

interface DishPickerProps {
  isOpen: boolean;
  onClose: () => void;
  dishOptions: DishOption[];
  alreadySelected: string[];
  onConfirm: (selected: string[]) => void;
  getImageUrl: (img: string | null) => string | null;
  categories: { category_id: number; category_name: string }[];
  sizes: string[];
  crusts: string[];
}

export function DishPicker({ isOpen, onClose, dishOptions, alreadySelected, onConfirm, getImageUrl, categories, sizes, crusts }: DishPickerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [filterCats, setFilterCats] = useState<Set<string>>(new Set());
  const [filterSizes, setFilterSizes] = useState<Set<string>>(new Set());
  const [filterCrusts, setFilterCrusts] = useState<Set<string>>(new Set());

  // Reset when modal opens, but pre-check already selected items
  useEffect(() => {
    if (isOpen) {
      setSelected(new Set(alreadySelected));
      setSearch("");
      setFilterCats(new Set());
      setFilterSizes(new Set());
      setFilterCrusts(new Set());
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    let result = [...dishOptions];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(d => d.data.dish_name.toLowerCase().includes(s) || d.value.toLowerCase().includes(s));
    }
    if (filterCats.size > 0) {
      result = result.filter(d => d.data.category_name && filterCats.has(d.data.category_name));
    }
    if (filterSizes.size > 0) {
      result = result.filter(d => d.data.size && filterSizes.has(d.data.size));
    }
    if (filterCrusts.size > 0) {
      result = result.filter(d => d.data.crust && filterCrusts.has(d.data.crust));
    }
    return result;
  }, [dishOptions, alreadySelected, search, filterCats, filterSizes, filterCrusts]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (filtered.length > 0 && selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(d => d.value)));
    }
  };

  const toggleFilterItem = (_current: Set<string>, val: string, setter: React.Dispatch<React.SetStateAction<Set<string>>>) => {
    setter(prev => {
      const n = new Set(prev);
      if (n.has(val)) n.delete(val); else n.add(val);
      return n;
    });
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selected));
    onClose();
  };

  // Dynamic filter options: sizes/crusts update based on selected categories
  const availableCats = useMemo(() => {
    const s = new Set<string>();
    dishOptions.forEach(d => { if (d.data.category_name) s.add(d.data.category_name); });
    return Array.from(s);
  }, [dishOptions]);

  // Dishes after category filter (used to derive available sizes/crusts)
  const dishesAfterCatFilter = useMemo(() => {
    if (filterCats.size === 0) return dishOptions;
    return dishOptions.filter(d => d.data.category_name && filterCats.has(d.data.category_name));
  }, [dishOptions, filterCats]);

  // Available sizes based on category-filtered dishes
  const availableSizes = useMemo(() => {
    const s = new Set<string>();
    dishesAfterCatFilter.forEach(d => { if (d.data.size) s.add(d.data.size); });
    return Array.from(s);
  }, [dishesAfterCatFilter]);

  // Available crusts based on category-filtered dishes
  const availableCrusts = useMemo(() => {
    const s = new Set<string>();
    dishesAfterCatFilter.forEach(d => { if (d.data.crust) s.add(d.data.crust); });
    return Array.from(s);
  }, [dishesAfterCatFilter]);

  // When category filter changes, clear size/crust selections that are no longer valid
  useEffect(() => {
    setFilterSizes(prev => {
      const valid = new Set([...prev].filter(s => availableSizes.includes(s)));
      return valid.size === prev.size ? prev : valid;
    });
    setFilterCrusts(prev => {
      const valid = new Set([...prev].filter(c => availableCrusts.includes(c)));
      return valid.size === prev.size ? prev : valid;
    });
  }, [availableSizes, availableCrusts]);

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} setIsOpen={(v) => { if (!v) onClose(); }} title="" className="max-w-[950px] p-0 sm:p-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stroke px-6 py-4 dark:border-dark-3">
        <h3 className="text-lg font-bold text-dark dark:text-white">Configure Combo Dishes</h3>
        <button type="button" onClick={handleConfirm} className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600">
          Confirm selection ({selected.size})
        </button>
      </div>

      <div className="flex" style={{ minHeight: 420 }}>
        {/* Left: Filters */}
        <div className="w-56 shrink-0 border-r border-stroke bg-gray-50/50 p-5 dark:border-dark-3 dark:bg-dark-2/30">
          <div className="mb-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Category</h4>
            <div className="space-y-2.5">
              {availableCats.map(c => (
                <label key={c} className="flex cursor-pointer items-center gap-2.5 select-none">
                  <input
                    type="checkbox"
                    checked={filterCats.has(c)}
                    onChange={() => toggleFilterItem(filterCats, c, setFilterCats)}
                    className="size-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-dark dark:text-white">{c}</span>
                </label>
              ))}
            </div>
          </div>

          {availableSizes.length > 0 && (
            <div className="mb-5">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Size</h4>
              <div className="space-y-2.5">
                {availableSizes.map(s => (
                  <label key={s} className="flex cursor-pointer items-center gap-2.5 select-none">
                    <input
                      type="checkbox"
                      checked={filterSizes.has(s)}
                      onChange={() => toggleFilterItem(filterSizes, s, setFilterSizes)}
                      className="size-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-dark dark:text-white">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {availableCrusts.length > 0 && (
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Crust Type</h4>
              <div className="space-y-2.5">
                {availableCrusts.map(c => (
                  <label key={c} className="flex cursor-pointer items-center gap-2.5 select-none">
                    <input
                      type="checkbox"
                      checked={filterCrusts.has(c)}
                      onChange={() => toggleFilterItem(filterCrusts, c, setFilterCrusts)}
                      className="size-4 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-dark dark:text-white">{c}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Search + Table */}
        <div className="flex-1 p-5">
          <input
            type="text"
            placeholder="Search dish code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4 w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 outline-none focus:border-primary dark:border-dark-3"
          />

          <div className="overflow-hidden rounded-lg border border-stroke dark:border-dark-3">
            <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-gray-100 dark:bg-dark-2">
                  <tr>
                    <th className="w-10 px-3 py-3">
                      <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length} onChange={toggleAll} className="size-4 cursor-pointer rounded" />
                    </th>
                    <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300">Image</th>
                    <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300">Dish Name</th>
                    <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                    <th className="px-3 py-3 font-semibold text-gray-600 dark:text-gray-300">Size / Crust</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No matching dishes found</td></tr>
                  ) : filtered.map(d => (
                    <tr
                      key={d.value}
                      onClick={() => toggleSelect(d.value)}
                      className={`cursor-pointer border-b border-stroke transition last:border-0 dark:border-dark-3 ${selected.has(d.value) ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-dark-2/50'}`}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(d.value)}
                          onChange={() => toggleSelect(d.value)}
                          className="size-4 cursor-pointer rounded"
                        />
                      </td>
                      <td className="px-3 py-3">
                        {d.data.image ? (
                          <img src={getImageUrl(d.data.image)!} alt="" className="h-9 w-9 rounded object-cover" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded bg-gray-200 text-[10px] text-gray-400 dark:bg-dark-3">N/A</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-dark dark:text-white">{d.data.dish_name}</div>
                        <div className="text-xs text-gray-400">{d.value}</div>
                      </td>
                      <td className="px-3 py-3">
                        {d.data.category_name && <Badge variant="light">{d.data.category_name}</Badge>}
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                        {d.data.size || 'Default'} - {d.data.crust || 'Default'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

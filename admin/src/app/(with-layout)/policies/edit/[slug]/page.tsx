"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  LayoutGrid,
  FileText
} from "lucide-react";

interface SubItem {
  item_number: string;
  content: string;
  display_order: number;
}

interface Section {
  section_number: string;
  title_section: string;
  display_order: number;
  sub_items: SubItem[];
}

export default function EditPolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPolicy() {
      try {
        const res = await api.get(`/api/policies/${slug}?format=structured`);
        if (res.data?.success) {
          setTitle(res.data.data.title);
          setSections(res.data.data.content || []);
        } else {
          toast.error("Không tìm thấy chính sách này.");
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi tải chính sách.");
      } finally {
        setLoading(false);
      }
    }
    fetchPolicy();
  }, [slug]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Vui lòng điền tiêu đề chính sách.");
      return;
    }
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i];
      if (!sec.section_number.trim()) {
        toast.error(`Thiếu số thứ tự danh mục ở phần #${i + 1}`);
        return;
      }
      if (!sec.title_section.trim()) {
        toast.error(`Thiếu tên danh mục ở phần #${i + 1}`);
        return;
      }
      for (let j = 0; j < sec.sub_items.length; j++) {
        const item = sec.sub_items[j];
        if (!item.content.trim()) {
          toast.error(`Nội dung chi tiết không được để trống ở phần #${i + 1}, dòng #${j + 1}`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      const res = await api.put(`/api/policies/${slug}?format=structured`, {
        title: title.trim(),
        content: sections
      });
      if (res.data?.success) {
        toast.success("Lưu cấu trúc chính sách thành công!");
        router.push("/policies");
      } else {
        toast.error("Lưu thất bại.");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu.");
    } finally {
      setSaving(false);
    }
  };

  const updateSectionField = (index: number, field: keyof Section, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    setSections(updated);
  };

  const addSection = () => {
    const maxOrder = sections.length > 0
      ? Math.max(...sections.map(s => s.display_order || 0))
      : 0;
    const newSection: Section = {
      section_number: "",
      title_section: "",
      display_order: maxOrder + 1,
      sub_items: []
    };
    setSections([newSection, ...sections]);
  };

  const deleteSection = (index: number) => {
    const updated = sections.filter((_, i) => i !== index);
    setSections(updated);
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === sections.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSections(updated);
  };

  const updateSubItemField = (sIndex: number, iIndex: number, field: keyof SubItem, value: any) => {
    const updated = [...sections];
    const subItems = [...updated[sIndex].sub_items];
    subItems[iIndex] = { ...subItems[iIndex], [field]: value };
    updated[sIndex] = { ...updated[sIndex], sub_items: subItems };
    setSections(updated);
  };

  const addSubItem = (sIndex: number) => {
    const updated = [...sections];
    const maxOrder = updated[sIndex].sub_items.length > 0
      ? Math.max(...updated[sIndex].sub_items.map(i => i.display_order || 0))
      : 0;
    const newSub: SubItem = {
      item_number: "",
      content: "",
      display_order: maxOrder + 1
    };
    updated[sIndex] = {
      ...updated[sIndex],
      sub_items: [newSub, ...updated[sIndex].sub_items]
    };
    setSections(updated);
  };

  const deleteSubItem = (sIndex: number, iIndex: number) => {
    const updated = [...sections];
    const subItems = updated[sIndex].sub_items.filter((_, i) => i !== iIndex);
    updated[sIndex] = { ...updated[sIndex], sub_items: subItems };
    setSections(updated);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-gray-500">Đang tải cấu trúc chính sách...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-270">
      <Breadcrumb pageName="Cập nhật chi tiết chính sách" />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => router.push("/policies")}
          className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-semibold text-dark hover:bg-gray-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800 shadow-sm"
        >
          <ArrowLeft size={16} />
          Quay lại
        </button>
      </div>

      <div className="space-y-6">
        {/* Policy Meta */}
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <h3 className="mb-4 text-md font-bold text-dark dark:text-white">Thông tin chính</h3>
          <div>
            <label className="mb-2 block text-sm font-bold text-dark dark:text-white">
              Tiêu đề chính sách <span className="text-red-500">(*)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tên chính sách (lưu vào chapter_name)"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2.5 text-dark outline-none focus:border-primary dark:border-zinc-800 dark:text-white dark:focus:border-primary text-sm font-semibold"
            />
          </div>
        </div>

        {/* Policy Sections Container */}
        <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm dark:border-dark-3 dark:bg-gray-dark">
          <div className="mb-6 flex items-center justify-between border-b border-stroke pb-4 dark:border-zinc-800">
            <div>
              <h3 className="text-md font-bold text-dark dark:text-white">Danh mục mục chính sách</h3>
              <p className="text-xs text-gray-500 mt-1">Cấu trúc các khối danh mục chính và nội dung bên trong chính sách</p>
            </div>
            <button
              onClick={addSection}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#005A43] hover:bg-[#004735] px-4 py-2 text-xs font-bold text-white shadow-sm"
            >
              <Plus size={14} />
              Thêm danh mục
            </button>
          </div>

          {sections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stroke bg-gray-50 py-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
              <p className="text-sm text-gray-500">Chưa có danh mục nào. Bấm nút "Thêm danh mục" để bắt đầu thiết lập.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map((section, sIndex) => (
                <div
                  key={sIndex}
                  className="rounded-2xl border border-stroke bg-gray-50/50 p-6 dark:border-zinc-800 dark:bg-zinc-900/30 relative"
                >
                  {/* Block Header */}
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-stroke pb-3 dark:border-zinc-800">
                    <span className="text-sm font-extrabold text-[#005A43] inline-flex items-center gap-1.5">
                      <LayoutGrid size={16} />
                      Khối Danh Mục #{sIndex + 1}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveSection(sIndex, "up")}
                        disabled={sIndex === 0}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        title="Di chuyển lên"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(sIndex, "down")}
                        disabled={sIndex === sections.length - 1}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSection(sIndex)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                        title="Xóa danh mục này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Block Inputs */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-gray-500 uppercase">
                        Số thứ tự danh mục <span className="text-red-500">(*)</span>
                      </label>
                      <input
                        type="text"
                        value={section.section_number}
                        onChange={(e) => updateSectionField(sIndex, "section_number", e.target.value)}
                        placeholder="Ví dụ: I, II, 1, 2"
                        className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-zinc-800 dark:bg-transparent dark:text-white"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-xs font-bold text-gray-500 uppercase">
                        Tên danh mục <span className="text-red-500">(*)</span>
                      </label>
                      <input
                        type="text"
                        value={section.title_section}
                        onChange={(e) => updateSectionField(sIndex, "title_section", e.target.value)}
                        placeholder="Nhập tên danh mục"
                        className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-zinc-800 dark:bg-transparent dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold text-gray-500 uppercase">
                        Thứ tự hiển thị
                      </label>
                      <input
                        type="number"
                        value={section.display_order}
                        onChange={(e) => updateSectionField(sIndex, "display_order", parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded-lg border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none focus:border-primary dark:border-zinc-800 dark:bg-transparent dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Sub items Area */}
                  <div className="mt-6 border-t border-stroke pt-4 dark:border-zinc-800">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-black text-gray-600 uppercase tracking-wider inline-flex items-center gap-1.5 dark:text-zinc-300">
                          <FileText size={14} className="text-orange-500" />
                          Nội dung chi tiết
                        </span>
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                          * SỐ THỨ TỰ HIỂN THỊ KHÔNG ĐƯỢC TRÙNG LẶP VỚI NHAU
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => addSubItem(sIndex)}
                        className="inline-flex items-center gap-1 rounded bg-[#D97706] hover:bg-[#B45309] px-3 py-1 text-[11px] font-bold text-white shadow-sm transition-all"
                      >
                        <Plus size={12} />
                        Thêm nội dung
                      </button>
                    </div>

                    {section.sub_items.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-2">Chưa có chi tiết nào. Bấm nút bên phải để thêm.</p>
                    ) : (
                      <div className="space-y-4">
                        {section.sub_items.map((subItem, iIndex) => (
                          <div
                            key={iIndex}
                            className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start bg-white dark:bg-zinc-900/50 p-3.5 rounded-lg border border-stroke dark:border-zinc-800/80"
                          >
                            <div className="md:col-span-2">
                              <label className="mb-1 block text-[10px] font-extrabold text-gray-400 uppercase">
                                Ký tự gạch đầu dòng
                              </label>
                              <input
                                type="text"
                                value={subItem.item_number || ""}
                                onChange={(e) => updateSubItemField(sIndex, iIndex, "item_number", e.target.value)}
                                placeholder="Ví dụ: -, *, a, b, 1.1..."
                                className="w-full rounded-lg border border-stroke bg-transparent px-2.5 py-1.5 text-xs text-dark outline-none focus:border-primary dark:border-zinc-800 dark:text-white"
                              />
                              <p className="mt-1 text-[9px] text-gray-450 dark:text-zinc-500 leading-normal">
                                ℹ️ Định dạng ký tự hiển thị ở đầu câu.
                              </p>
                            </div>

                            <div className="md:col-span-7">
                              <label className="mb-1 block text-[10px] font-extrabold text-gray-400 uppercase">
                                Nội dung <span className="text-red-500">(*)</span>
                              </label>
                              <input
                                type="text"
                                value={subItem.content}
                                onChange={(e) => updateSubItemField(sIndex, iIndex, "content", e.target.value)}
                                placeholder="Nhập câu nội dung quy định chi tiết..."
                                className="w-full rounded-lg border border-stroke bg-transparent px-2.5 py-1.5 text-xs text-dark outline-none focus:border-primary dark:border-zinc-800 dark:text-white"
                                required
                              />
                              <p className="mt-1 text-[9px] text-gray-450 dark:text-zinc-500 leading-normal">
                                ℹ️ Nội dung văn bản thực tế của quy định.
                              </p>
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-1 block text-[10px] font-extrabold text-gray-400 uppercase">
                                Thứ tự hiển thị
                              </label>
                              <input
                                type="number"
                                value={subItem.display_order}
                                onChange={(e) => updateSubItemField(sIndex, iIndex, "display_order", parseInt(e.target.value, 10) || 0)}
                                className="w-full rounded-lg border border-stroke bg-transparent px-2.5 py-1.5 text-xs text-dark outline-none focus:border-primary dark:border-zinc-800 dark:text-white"
                              />
                              <p className="mt-1 text-[9px] text-gray-450 dark:text-zinc-500 leading-normal">
                                Thứ tự dòng.
                              </p>
                            </div>

                            <div className="md:col-span-1 flex justify-center pt-5">
                              <button
                                type="button"
                                onClick={() => deleteSubItem(sIndex, iIndex)}
                                className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                                title="Xóa nội dung này"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-center pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#005A43] hover:bg-[#004735] text-white font-extrabold px-12 py-3.5 shadow-lg text-sm transition-all disabled:opacity-50 tracking-wider uppercase"
          >
            {saving ? "ĐANG LƯU CẤU TRÚC..." : "LƯU CẤU TRÚC"}
          </button>
        </div>
      </div>
    </div>
  );
}

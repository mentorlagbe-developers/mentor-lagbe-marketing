"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Sparkles } from "lucide-react";
import { ApiError, apiFetch } from "@/lib/api";
import { Modal } from "@/app/components/ui/modal";
import {
  getCertificationExam,
  listCertificationCategories,
  listCertificationExams,
  listCertificationVendors,
  uploadCertificationImage,
} from "@/lib/certifications-api";

type AdminExam = {
  id: string;
  examCode: string;
  title: string;
  vendor: { name: string };
  effectivePriceBdt: string;
  isFeatured: boolean;
};

type Vendor = {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
};

type Category = { id: string; name: string; slug: string };
type MaterialType = "pdf" | "video" | "link" | "practice_test" | "study_guide";

type VendorForm = {
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  sortOrder: string;
  isActive: boolean;
};

type ExamForm = {
  examCode: string;
  slug: string;
  title: string;
  shortDescription: string;
  overview: string;
  vendorId: string;
  categoryId: string;
  level: "beginner" | "intermediate" | "advanced" | "all_levels";
  originalPriceBdt: string;
  salePriceBdt: string;
  certificateAvailable: boolean;
  isOfficialVoucher: boolean;
  includesTraining: boolean;
  examDurationMinutes: string;
  passingScorePercent: string;
  ratingAverage: string;
  ratingCount: string;
  thumbnailUrl: string;
  badgeLabel: string;
  isPublished: boolean;
  isFeatured: boolean;
  prerequisites: string;
  examFormat: string;
  languages: string;
};

type MaterialForm = {
  examId: string;
  materialId: string;
  title: string;
  description: string;
  materialType: MaterialType;
  fileUrl: string;
  externalUrl: string;
  durationSec: string;
  sortOrder: string;
  isPreview: boolean;
  isActive: boolean;
};

const INITIAL_VENDOR: VendorForm = {
  name: "",
  slug: "",
  logoUrl: "",
  description: "",
  sortOrder: "1",
  isActive: true,
};

const INITIAL_EXAM: ExamForm = {
  examCode: "",
  slug: "",
  title: "",
  shortDescription: "",
  overview: "",
  vendorId: "",
  categoryId: "",
  level: "all_levels",
  originalPriceBdt: "",
  salePriceBdt: "",
  certificateAvailable: true,
  isOfficialVoucher: true,
  includesTraining: true,
  examDurationMinutes: "",
  passingScorePercent: "",
  ratingAverage: "",
  ratingCount: "",
  thumbnailUrl: "",
  badgeLabel: "",
  isPublished: true,
  isFeatured: false,
  prerequisites: "",
  examFormat: "",
  languages: "English",
};

const INITIAL_MATERIAL: MaterialForm = {
  examId: "",
  materialId: "",
  title: "",
  description: "",
  materialType: "pdf",
  fileUrl: "",
  externalUrl: "",
  durationSec: "",
  sortOrder: "1",
  isPreview: false,
  isActive: true,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toOptionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const inputCls = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900";
const textareaCls = "min-h-[84px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900";

function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      {children}
    </label>
  );
}

export function AdminCertificationsPanel() {
  const [items, setItems] = useState<AdminExam[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateVendor, setShowCreateVendor] = useState(false);
  const [showUpdateVendor, setShowUpdateVendor] = useState(false);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showUpdateExam, setShowUpdateExam] = useState(false);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [showUpdateMaterial, setShowUpdateMaterial] = useState(false);

  const [vendorForm, setVendorForm] = useState<VendorForm>(INITIAL_VENDOR);
  const [examForm, setExamForm] = useState<ExamForm>(INITIAL_EXAM);
  const [materialForm, setMaterialForm] = useState<MaterialForm>(INITIAL_MATERIAL);

  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [examMaterials, setExamMaterials] = useState<Array<{ id: string; title: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [examSlugEdited, setExamSlugEdited] = useState(false);
  const [vendorSlugEdited, setVendorSlugEdited] = useState(false);

  const selectedVendor = useMemo(
    () => vendors.find((v) => v.id === examForm.vendorId),
    [vendors, examForm.vendorId]
  );

  useEffect(() => {
    if (examSlugEdited) return;
    const next = slugify(`${examForm.examCode} ${examForm.title} ${selectedVendor?.slug ?? ""}`);
    setExamForm((prev) => ({ ...prev, slug: next }));
  }, [examForm.examCode, examForm.title, selectedVendor?.slug, examSlugEdited]);

  useEffect(() => {
    if (vendorSlugEdited) return;
    setVendorForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
  }, [vendorForm.name, vendorSlugEdited]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [examData, vendorData, categoryData] = await Promise.all([
        listCertificationExams({ limit: "50" }, { auth: true }),
        listCertificationVendors(),
        listCertificationCategories(),
      ]);

      setItems(
        examData.items.map((item) => ({
          id: item.id,
          examCode: item.examCode,
          title: item.title,
          vendor: { name: item.vendor.name },
          effectivePriceBdt: item.effectivePriceBdt,
          isFeatured: item.isFeatured,
        }))
      );
      setVendors(vendorData.filter((v) => v.isActive !== false));
      setCategories(categoryData.filter((c) => c.isActive !== false));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load certification admin data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!showUpdateVendor || !selectedVendorId) return;
    const found = vendors.find((v) => v.id === selectedVendorId);
    if (!found) return;
    setVendorForm({
      name: found.name,
      slug: found.slug,
      logoUrl: found.logoUrl ?? "",
      description: found.description ?? "",
      sortOrder: String(found.sortOrder ?? 1),
      isActive: found.isActive ?? true,
    });
    setVendorSlugEdited(true);
  }, [showUpdateVendor, selectedVendorId, vendors]);

  useEffect(() => {
    if (!showUpdateExam || !selectedExamId) return;
    void (async () => {
      try {
        const detail = await getCertificationExam(selectedExamId);
        setExamForm({
          examCode: detail.examCode,
          slug: detail.slug,
          title: detail.title,
          shortDescription: detail.shortDescription ?? "",
          overview: detail.overview ?? "",
          vendorId: detail.vendor.id,
          categoryId: detail.category?.id ?? "",
          level: detail.level,
          originalPriceBdt: detail.originalPriceBdt,
          salePriceBdt: detail.salePriceBdt ?? "",
          certificateAvailable: detail.certificateAvailable,
          isOfficialVoucher: detail.isOfficialVoucher,
          includesTraining: detail.includesTraining,
          examDurationMinutes: String(detail.examDurationMinutes ?? ""),
          passingScorePercent: String(detail.passingScorePercent ?? ""),
          ratingAverage: String(detail.ratingAverage ?? ""),
          ratingCount: String(detail.ratingCount ?? ""),
          thumbnailUrl: detail.thumbnailUrl ?? "",
          badgeLabel: detail.badgeLabel ?? "",
          isPublished: true,
          isFeatured: detail.isFeatured,
          prerequisites: detail.prerequisites ?? "",
          examFormat: detail.examFormat ?? "",
          languages: detail.languages ?? "English",
        });
        setExamSlugEdited(true);
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not load exam detail.");
      }
    })();
  }, [showUpdateExam, selectedExamId]);

  useEffect(() => {
    if ((!showCreateMaterial && !showUpdateMaterial) || !materialForm.examId) return;
    void (async () => {
      try {
        const detail = await getCertificationExam(materialForm.examId);
        setExamMaterials(detail.materials.map((m) => ({ id: m.id, title: m.title })));
      } catch {
        setExamMaterials([]);
      }
    })();
  }, [showCreateMaterial, showUpdateMaterial, materialForm.examId]);

  async function uploadImage(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadCertificationImage(file);
      setExamForm((prev) => ({ ...prev, thumbnailUrl: uploaded.imageUrl }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not upload image.");
    } finally {
      setUploading(false);
    }
  }

  async function createVendor(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/certifications/vendors", {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          name: vendorForm.name.trim(),
          slug: vendorForm.slug.trim(),
          logoUrl: vendorForm.logoUrl.trim() || undefined,
          description: vendorForm.description.trim() || undefined,
          sortOrder: toOptionalNumber(vendorForm.sortOrder) ?? 1,
          isActive: vendorForm.isActive,
        }),
      });
      setShowCreateVendor(false);
      setVendorForm(INITIAL_VENDOR);
      setVendorSlugEdited(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create vendor.");
    } finally {
      setSaving(false);
    }
  }

  async function updateVendor(e: FormEvent) {
    e.preventDefault();
    if (!selectedVendorId) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/certifications/vendors/${encodeURIComponent(selectedVendorId)}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          name: vendorForm.name.trim(),
          slug: vendorForm.slug.trim(),
          logoUrl: vendorForm.logoUrl.trim() || undefined,
          description: vendorForm.description.trim() || undefined,
          sortOrder: toOptionalNumber(vendorForm.sortOrder) ?? 1,
          isActive: vendorForm.isActive,
        }),
      });
      setShowUpdateVendor(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update vendor.");
    } finally {
      setSaving(false);
    }
  }

  function buildExamPayload(form: ExamForm) {
    return {
      examCode: form.examCode.trim(),
      slug: form.slug.trim(),
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim() || undefined,
      overview: form.overview.trim() || undefined,
      vendorId: form.vendorId,
      categoryId: form.categoryId,
      level: form.level,
      originalPriceBdt: Number(form.originalPriceBdt),
      salePriceBdt: toOptionalNumber(form.salePriceBdt),
      certificateAvailable: form.certificateAvailable,
      isOfficialVoucher: form.isOfficialVoucher,
      includesTraining: form.includesTraining,
      examDurationMinutes: toOptionalNumber(form.examDurationMinutes),
      passingScorePercent: toOptionalNumber(form.passingScorePercent),
      ratingAverage: toOptionalNumber(form.ratingAverage),
      ratingCount: toOptionalNumber(form.ratingCount),
      thumbnailUrl: form.thumbnailUrl.trim() || undefined,
      badgeLabel: form.badgeLabel.trim() || undefined,
      isPublished: form.isPublished,
      isFeatured: form.isFeatured,
      prerequisites: form.prerequisites.trim() || undefined,
      examFormat: form.examFormat.trim() || undefined,
      languages: form.languages.trim() || undefined,
    };
  }

  async function createExam(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/certifications/exams", {
        method: "POST",
        auth: true,
        body: JSON.stringify(buildExamPayload(examForm)),
      });
      setShowCreateExam(false);
      setExamForm((prev) => ({ ...INITIAL_EXAM, vendorId: prev.vendorId, categoryId: prev.categoryId }));
      setExamSlugEdited(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create exam.");
    } finally {
      setSaving(false);
    }
  }

  async function updateExam(e: FormEvent) {
    e.preventDefault();
    if (!selectedExamId) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/certifications/exams/${encodeURIComponent(selectedExamId)}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify(buildExamPayload(examForm)),
      });
      setShowUpdateExam(false);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update exam.");
    } finally {
      setSaving(false);
    }
  }

  async function createMaterial(e: FormEvent) {
    e.preventDefault();
    if (!materialForm.examId) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/certifications/exams/${encodeURIComponent(materialForm.examId)}/materials`, {
        method: "POST",
        auth: true,
        body: JSON.stringify({
          title: materialForm.title.trim(),
          description: materialForm.description.trim() || undefined,
          materialType: materialForm.materialType,
          fileUrl: materialForm.fileUrl.trim() || undefined,
          externalUrl: materialForm.externalUrl.trim() || undefined,
          durationSec: toOptionalNumber(materialForm.durationSec),
          sortOrder: toOptionalNumber(materialForm.sortOrder) ?? 1,
          isPreview: materialForm.isPreview,
          isActive: materialForm.isActive,
        }),
      });
      setShowCreateMaterial(false);
      setMaterialForm(INITIAL_MATERIAL);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create material.");
    } finally {
      setSaving(false);
    }
  }

  async function updateMaterial(e: FormEvent) {
    e.preventDefault();
    if (!materialForm.materialId) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/certifications/materials/${encodeURIComponent(materialForm.materialId)}`, {
        method: "PATCH",
        auth: true,
        body: JSON.stringify({
          title: materialForm.title.trim(),
          description: materialForm.description.trim() || undefined,
          materialType: materialForm.materialType,
          fileUrl: materialForm.fileUrl.trim() || undefined,
          externalUrl: materialForm.externalUrl.trim() || undefined,
          durationSec: toOptionalNumber(materialForm.durationSec),
          sortOrder: toOptionalNumber(materialForm.sortOrder) ?? 1,
          isPreview: materialForm.isPreview,
          isActive: materialForm.isActive,
        }),
      });
      setShowUpdateMaterial(false);
      setMaterialForm(INITIAL_MATERIAL);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update material.");
    } finally {
      setSaving(false);
    }
  }

  function ActionButton({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        {icon}
        {label}
      </button>
    );
  }

  function ExamFields() {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="Exam code"><input className={inputCls} value={examForm.examCode} onChange={(e) => setExamForm((p) => ({ ...p, examCode: e.target.value }))} required /></LabeledField>
          <LabeledField label="Title"><input className={inputCls} value={examForm.title} onChange={(e) => setExamForm((p) => ({ ...p, title: e.target.value }))} required /></LabeledField>
          <LabeledField label="Vendor"><select className={inputCls} value={examForm.vendorId} onChange={(e) => setExamForm((p) => ({ ...p, vendorId: e.target.value }))} required><option value="">Select vendor</option>{vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}</select></LabeledField>
          <LabeledField label="Category"><select className={inputCls} value={examForm.categoryId} onChange={(e) => setExamForm((p) => ({ ...p, categoryId: e.target.value }))} required><option value="">Select category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></LabeledField>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="Slug"><input className={inputCls} value={examForm.slug} onChange={(e) => { setExamSlugEdited(true); setExamForm((p) => ({ ...p, slug: slugify(e.target.value) })); }} required /></LabeledField>
          <LabeledField label="Level"><select className={inputCls} value={examForm.level} onChange={(e) => setExamForm((p) => ({ ...p, level: e.target.value as ExamForm["level"] }))}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option><option value="all_levels">All levels</option></select></LabeledField>
          <LabeledField label="Original price (BDT)"><input className={inputCls} type="number" min={0} value={examForm.originalPriceBdt} onChange={(e) => setExamForm((p) => ({ ...p, originalPriceBdt: e.target.value }))} required /></LabeledField>
          <LabeledField label="Sale price (BDT)"><input className={inputCls} type="number" min={0} value={examForm.salePriceBdt} onChange={(e) => setExamForm((p) => ({ ...p, salePriceBdt: e.target.value }))} /></LabeledField>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <LabeledField label="Duration (minutes)"><input className={inputCls} type="number" min={0} value={examForm.examDurationMinutes} onChange={(e) => setExamForm((p) => ({ ...p, examDurationMinutes: e.target.value }))} /></LabeledField>
          <LabeledField label="Passing score (%)"><input className={inputCls} type="number" min={0} max={100} value={examForm.passingScorePercent} onChange={(e) => setExamForm((p) => ({ ...p, passingScorePercent: e.target.value }))} /></LabeledField>
          <LabeledField label="Rating average"><input className={inputCls} type="number" min={0} max={5} step="0.1" value={examForm.ratingAverage} onChange={(e) => setExamForm((p) => ({ ...p, ratingAverage: e.target.value }))} /></LabeledField>
          <LabeledField label="Rating count"><input className={inputCls} type="number" min={0} value={examForm.ratingCount} onChange={(e) => setExamForm((p) => ({ ...p, ratingCount: e.target.value }))} /></LabeledField>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <LabeledField label="Badge label"><input className={inputCls} value={examForm.badgeLabel} onChange={(e) => setExamForm((p) => ({ ...p, badgeLabel: e.target.value }))} /></LabeledField>
          <LabeledField label="Languages"><input className={inputCls} value={examForm.languages} onChange={(e) => setExamForm((p) => ({ ...p, languages: e.target.value }))} /></LabeledField>
        </div>
        <LabeledField label="Exam format"><input className={inputCls} value={examForm.examFormat} onChange={(e) => setExamForm((p) => ({ ...p, examFormat: e.target.value }))} /></LabeledField>
        <LabeledField label="Short description"><textarea className={textareaCls} value={examForm.shortDescription} onChange={(e) => setExamForm((p) => ({ ...p, shortDescription: e.target.value }))} /></LabeledField>
        <LabeledField label="Overview"><textarea className={textareaCls} value={examForm.overview} onChange={(e) => setExamForm((p) => ({ ...p, overview: e.target.value }))} /></LabeledField>
        <LabeledField label="Prerequisites"><textarea className={textareaCls} value={examForm.prerequisites} onChange={(e) => setExamForm((p) => ({ ...p, prerequisites: e.target.value }))} /></LabeledField>
        <div className="space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Thumbnail image</span>
          <div className="flex flex-wrap items-center gap-2">
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(e) => void uploadImage(e.target.files?.[0] ?? null)} className="text-xs" />
            {uploading ? <span className="text-xs text-slate-500">Uploading...</span> : null}
            {examForm.thumbnailUrl ? <span className="truncate text-xs text-emerald-600">{examForm.thumbnailUrl}</span> : null}
          </div>
        </div>
        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2 xl:grid-cols-3 dark:border-slate-700 dark:bg-slate-800/40">
          <label className="flex items-center gap-2"><input type="checkbox" checked={examForm.certificateAvailable} onChange={(e) => setExamForm((p) => ({ ...p, certificateAvailable: e.target.checked }))} />Certificate available</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={examForm.isOfficialVoucher} onChange={(e) => setExamForm((p) => ({ ...p, isOfficialVoucher: e.target.checked }))} />Official voucher</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={examForm.includesTraining} onChange={(e) => setExamForm((p) => ({ ...p, includesTraining: e.target.checked }))} />Includes training</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={examForm.isPublished} onChange={(e) => setExamForm((p) => ({ ...p, isPublished: e.target.checked }))} />Published</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={examForm.isFeatured} onChange={(e) => setExamForm((p) => ({ ...p, isFeatured: e.target.checked }))} />Featured</label>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Certification Exam Management</h2>
        <p className="mt-1 text-sm text-slate-500">Create and update vendors, exams, and materials with dedicated modal forms.</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <ActionButton label="Add Vendor" icon={<Plus className="h-4 w-4" />} onClick={() => { setVendorForm(INITIAL_VENDOR); setVendorSlugEdited(false); setShowCreateVendor(true); }} />
        <ActionButton label="Update Vendor" icon={<Pencil className="h-4 w-4" />} onClick={() => setShowUpdateVendor(true)} />
        <ActionButton label="Add Exam" icon={<Plus className="h-4 w-4" />} onClick={() => { setExamForm((p) => ({ ...INITIAL_EXAM, vendorId: p.vendorId, categoryId: p.categoryId })); setExamSlugEdited(false); setShowCreateExam(true); }} />
        <ActionButton label="Update Exam" icon={<Pencil className="h-4 w-4" />} onClick={() => setShowUpdateExam(true)} />
        <ActionButton label="Add Material" icon={<Plus className="h-4 w-4" />} onClick={() => { setMaterialForm(INITIAL_MATERIAL); setShowCreateMaterial(true); }} />
        <ActionButton label="Update Material" icon={<Pencil className="h-4 w-4" />} onClick={() => { setMaterialForm(INITIAL_MATERIAL); setShowUpdateMaterial(true); }} />
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-700">Existing certification exams</div>
        {loading ? <p className="p-4 text-sm text-slate-500">Loading...</p> : null}
        {!loading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                  <th className="px-4 py-2">Code</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Vendor</th>
                  <th className="px-4 py-2">Price</th>
                  <th className="px-4 py-2">Featured</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-2">{item.examCode}</td>
                    <td className="px-4 py-2">{item.title}</td>
                    <td className="px-4 py-2">{item.vendor.name}</td>
                    <td className="px-4 py-2">৳{item.effectivePriceBdt}</td>
                    <td className="px-4 py-2">{item.isFeatured ? "Yes" : "No"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      <Modal open={showCreateVendor} onClose={() => setShowCreateVendor(false)} className="max-w-2xl">
        <form onSubmit={createVendor} className="space-y-4 p-6">
          <h3 className="text-lg font-semibold">Create Vendor</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <LabeledField label="Name"><input className={inputCls} value={vendorForm.name} onChange={(e) => setVendorForm((p) => ({ ...p, name: e.target.value }))} required /></LabeledField>
            <LabeledField label="Slug"><input className={inputCls} value={vendorForm.slug} onChange={(e) => { setVendorSlugEdited(true); setVendorForm((p) => ({ ...p, slug: slugify(e.target.value) })); }} required /></LabeledField>
            <LabeledField label="Logo URL"><input className={inputCls} value={vendorForm.logoUrl} onChange={(e) => setVendorForm((p) => ({ ...p, logoUrl: e.target.value }))} /></LabeledField>
            <LabeledField label="Sort order"><input className={inputCls} type="number" value={vendorForm.sortOrder} onChange={(e) => setVendorForm((p) => ({ ...p, sortOrder: e.target.value }))} /></LabeledField>
          </div>
          <LabeledField label="Description"><textarea className={textareaCls} value={vendorForm.description} onChange={(e) => setVendorForm((p) => ({ ...p, description: e.target.value }))} /></LabeledField>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={vendorForm.isActive} onChange={(e) => setVendorForm((p) => ({ ...p, isActive: e.target.checked }))} />Active</label>
          <div className="flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">{saving ? "Saving..." : "Create vendor"}</button></div>
        </form>
      </Modal>

      <Modal open={showUpdateVendor} onClose={() => setShowUpdateVendor(false)} className="max-w-2xl">
        <form onSubmit={updateVendor} className="space-y-4 p-6">
          <h3 className="text-lg font-semibold">Update Vendor</h3>
          <LabeledField label="Select vendor">
            <select className={inputCls} value={selectedVendorId} onChange={(e) => setSelectedVendorId(e.target.value)} required>
              <option value="">Select vendor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </LabeledField>
          {selectedVendorId ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <LabeledField label="Name"><input className={inputCls} value={vendorForm.name} onChange={(e) => setVendorForm((p) => ({ ...p, name: e.target.value }))} required /></LabeledField>
                <LabeledField label="Slug"><input className={inputCls} value={vendorForm.slug} onChange={(e) => setVendorForm((p) => ({ ...p, slug: slugify(e.target.value) }))} required /></LabeledField>
                <LabeledField label="Logo URL"><input className={inputCls} value={vendorForm.logoUrl} onChange={(e) => setVendorForm((p) => ({ ...p, logoUrl: e.target.value }))} /></LabeledField>
                <LabeledField label="Sort order"><input className={inputCls} type="number" value={vendorForm.sortOrder} onChange={(e) => setVendorForm((p) => ({ ...p, sortOrder: e.target.value }))} /></LabeledField>
              </div>
              <LabeledField label="Description"><textarea className={textareaCls} value={vendorForm.description} onChange={(e) => setVendorForm((p) => ({ ...p, description: e.target.value }))} /></LabeledField>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={vendorForm.isActive} onChange={(e) => setVendorForm((p) => ({ ...p, isActive: e.target.checked }))} />Active</label>
              <div className="flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">{saving ? "Saving..." : "Update vendor"}</button></div>
            </>
          ) : null}
        </form>
      </Modal>

      <Modal open={showCreateExam} onClose={() => setShowCreateExam(false)} className="max-w-5xl">
        <form onSubmit={createExam} className="space-y-4 p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-700"><Sparkles className="h-4 w-4" />Create Exam</div>
          <ExamFields />
          <div className="flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">{saving ? "Saving..." : "Create exam"}</button></div>
        </form>
      </Modal>

      <Modal open={showUpdateExam} onClose={() => setShowUpdateExam(false)} className="max-w-5xl">
        <form onSubmit={updateExam} className="space-y-4 p-6">
          <h3 className="text-lg font-semibold">Update Exam</h3>
          <LabeledField label="Select exam">
            <select className={inputCls} value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} required>
              <option value="">Select exam</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.examCode} - {i.title}</option>)}
            </select>
          </LabeledField>
          {selectedExamId ? (
            <>
              <ExamFields />
              <div className="flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">{saving ? "Saving..." : "Update exam"}</button></div>
            </>
          ) : null}
        </form>
      </Modal>

      <Modal open={showCreateMaterial} onClose={() => setShowCreateMaterial(false)} className="max-w-3xl">
        <form onSubmit={createMaterial} className="space-y-4 p-6">
          <h3 className="text-lg font-semibold">Create Material</h3>
          <LabeledField label="Exam">
            <select className={inputCls} value={materialForm.examId} onChange={(e) => setMaterialForm((p) => ({ ...p, examId: e.target.value }))} required>
              <option value="">Select exam</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.examCode} - {i.title}</option>)}
            </select>
          </LabeledField>
          <div className="grid gap-3 md:grid-cols-2">
            <LabeledField label="Title"><input className={inputCls} value={materialForm.title} onChange={(e) => setMaterialForm((p) => ({ ...p, title: e.target.value }))} required /></LabeledField>
            <LabeledField label="Material type"><select className={inputCls} value={materialForm.materialType} onChange={(e) => setMaterialForm((p) => ({ ...p, materialType: e.target.value as MaterialType }))}><option value="pdf">pdf</option><option value="video">video</option><option value="link">link</option><option value="practice_test">practice_test</option><option value="study_guide">study_guide</option></select></LabeledField>
            <LabeledField label="File URL"><input className={inputCls} value={materialForm.fileUrl} onChange={(e) => setMaterialForm((p) => ({ ...p, fileUrl: e.target.value }))} /></LabeledField>
            <LabeledField label="External URL"><input className={inputCls} value={materialForm.externalUrl} onChange={(e) => setMaterialForm((p) => ({ ...p, externalUrl: e.target.value }))} /></LabeledField>
            <LabeledField label="Duration (sec)"><input className={inputCls} type="number" min={0} value={materialForm.durationSec} onChange={(e) => setMaterialForm((p) => ({ ...p, durationSec: e.target.value }))} /></LabeledField>
            <LabeledField label="Sort order"><input className={inputCls} type="number" min={0} value={materialForm.sortOrder} onChange={(e) => setMaterialForm((p) => ({ ...p, sortOrder: e.target.value }))} /></LabeledField>
          </div>
          <LabeledField label="Description"><textarea className={textareaCls} value={materialForm.description} onChange={(e) => setMaterialForm((p) => ({ ...p, description: e.target.value }))} /></LabeledField>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={materialForm.isPreview} onChange={(e) => setMaterialForm((p) => ({ ...p, isPreview: e.target.checked }))} />Preview</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={materialForm.isActive} onChange={(e) => setMaterialForm((p) => ({ ...p, isActive: e.target.checked }))} />Active</label>
          </div>
          <div className="flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">{saving ? "Saving..." : "Create material"}</button></div>
        </form>
      </Modal>

      <Modal open={showUpdateMaterial} onClose={() => setShowUpdateMaterial(false)} className="max-w-3xl">
        <form onSubmit={updateMaterial} className="space-y-4 p-6">
          <h3 className="text-lg font-semibold">Update Material</h3>
          <LabeledField label="Exam">
            <select className={inputCls} value={materialForm.examId} onChange={(e) => setMaterialForm((p) => ({ ...p, examId: e.target.value, materialId: "" }))} required>
              <option value="">Select exam</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.examCode} - {i.title}</option>)}
            </select>
          </LabeledField>
          <LabeledField label="Material">
            <select className={inputCls} value={materialForm.materialId} onChange={(e) => setMaterialForm((p) => ({ ...p, materialId: e.target.value }))} required>
              <option value="">Select material</option>
              {examMaterials.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
          </LabeledField>
          <div className="grid gap-3 md:grid-cols-2">
            <LabeledField label="Title"><input className={inputCls} value={materialForm.title} onChange={(e) => setMaterialForm((p) => ({ ...p, title: e.target.value }))} required /></LabeledField>
            <LabeledField label="Material type"><select className={inputCls} value={materialForm.materialType} onChange={(e) => setMaterialForm((p) => ({ ...p, materialType: e.target.value as MaterialType }))}><option value="pdf">pdf</option><option value="video">video</option><option value="link">link</option><option value="practice_test">practice_test</option><option value="study_guide">study_guide</option></select></LabeledField>
            <LabeledField label="File URL"><input className={inputCls} value={materialForm.fileUrl} onChange={(e) => setMaterialForm((p) => ({ ...p, fileUrl: e.target.value }))} /></LabeledField>
            <LabeledField label="External URL"><input className={inputCls} value={materialForm.externalUrl} onChange={(e) => setMaterialForm((p) => ({ ...p, externalUrl: e.target.value }))} /></LabeledField>
            <LabeledField label="Duration (sec)"><input className={inputCls} type="number" min={0} value={materialForm.durationSec} onChange={(e) => setMaterialForm((p) => ({ ...p, durationSec: e.target.value }))} /></LabeledField>
            <LabeledField label="Sort order"><input className={inputCls} type="number" min={0} value={materialForm.sortOrder} onChange={(e) => setMaterialForm((p) => ({ ...p, sortOrder: e.target.value }))} /></LabeledField>
          </div>
          <LabeledField label="Description"><textarea className={textareaCls} value={materialForm.description} onChange={(e) => setMaterialForm((p) => ({ ...p, description: e.target.value }))} /></LabeledField>
          <div className="flex gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={materialForm.isPreview} onChange={(e) => setMaterialForm((p) => ({ ...p, isPreview: e.target.checked }))} />Preview</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={materialForm.isActive} onChange={(e) => setMaterialForm((p) => ({ ...p, isActive: e.target.checked }))} />Active</label>
          </div>
          <div className="flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white">{saving ? "Saving..." : "Update material"}</button></div>
        </form>
      </Modal>
    </section>
  );
}

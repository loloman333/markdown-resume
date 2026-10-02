import * as localForage from "localforage";
import { downloadFile, isClient } from "@renovamen/utils";
import defaultData from "../assets/default-resume-data.json";
import defaultTemplate from "../assets/default-resume-template.md?raw";
import type { TemplateData } from "~/utils/templateParser";

export type LocalizedText = Record<string, string>;

export type TemplateFileRecord = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  content: string;
  partials: Record<string, string>;
  updatedAt: string;
};

export type DataRecord = {
  id: string;
  name: string;
  description: LocalizedText;
  data: TemplateData;
  updatedAt: string;
};

const TEMPLATE_FILES_KEY = "MARKDOWN_RESUME_template_files";
const DATA_FILES_KEY = "MARKDOWN_RESUME_data_files";
const DEFAULT_TEMPLATE_ID = "sample-resume";
const DEFAULT_DATA_ID = "sample-resume-data";

const isBrowserObject = (value: unknown): boolean => {
  if (typeof value !== "object" || value === null) return false;
  if (typeof window !== "undefined" && value === window) return true;
  if (typeof document !== "undefined" && value === document) return true;
  if (typeof Window !== "undefined" && value instanceof Window) return true;
  if (typeof Document !== "undefined" && value instanceof Document) return true;
  if (typeof Node !== "undefined" && value instanceof Node) return true;
  if (typeof Element !== "undefined" && value instanceof Element) return true;
  return Object.prototype.toString.call(value) === "[object Window]";
};

const sanitizeCloneValue = <T>(value: T): T => {
  if (value === undefined || typeof value === "function") return value;
  if (value === null || typeof value !== "object") return value;

  if (isBrowserObject(value)) return undefined as T;
  if (Array.isArray(value))
    return value.map((item) => sanitizeCloneValue(item)) as T;

  const sanitized: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (key === "window" || key === "document" || key === "globalThis") continue;
    const clean = sanitizeCloneValue(item);
    if (clean !== undefined) sanitized[key] = clean;
  }

  return sanitized as T;
};

const clone = <T>(value: T): T => {
  const sanitized = sanitizeCloneValue(value);

  try {
    return structuredClone(sanitized);
  } catch {
    return JSON.parse(JSON.stringify(sanitized));
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const defaultTemplateFile = (): TemplateFileRecord => ({
  id: DEFAULT_TEMPLATE_ID,
  name: { de: "Beispiel-Lebenslauf", en: "Sample Resume" },
  description: {
    de: "Zweispaltiger Markdown-Lebenslauf mit Ausbildung, Praxiserfahrung, Fähigkeiten und Interessen.",
    en: "Two-column Markdown resume with education, work experience, skills, and interests."
  },
  content: defaultTemplate,
  partials: {},
  updatedAt: new Date().toISOString()
});

const defaultDataFile = (): DataRecord => ({
  id: DEFAULT_DATA_ID,
  name: "Sample Resume Data",
  description: {
    de: "Strukturierte Beispieldaten für einen Lebenslauf.",
    en: "Structured sample data for a resume."
  },
  data: clone(defaultData) as TemplateData,
  updatedAt: new Date().toISOString()
});

const read = async <T>(key: string) => {
  if (!isClient) return {} as Record<string, T>;
  return (await localForage.getItem<Record<string, T>>(key)) || {};
};

const write = (key: string, value: Record<string, unknown>) =>
  localForage.setItem(key, value);

const ensureLibraries = async () => {
  const templates = await read<TemplateFileRecord>(TEMPLATE_FILES_KEY);
  const data = await read<DataRecord>(DATA_FILES_KEY);
  const initializeDefaults = Object.keys(templates).length === 0 && Object.keys(data).length === 0;

  if (initializeDefaults && !templates[DEFAULT_TEMPLATE_ID] && Object.keys(templates).length === 0)
    templates[DEFAULT_TEMPLATE_ID] = defaultTemplateFile();
  if (initializeDefaults && !data[DEFAULT_DATA_ID] && Object.keys(data).length === 0)
    data[DEFAULT_DATA_ID] = defaultDataFile();

  if (isClient) {
    await Promise.all([
      write(TEMPLATE_FILES_KEY, templates),
      write(DATA_FILES_KEY, data)
    ]);
  }

  return { templates, data };
};

export const getTemplateList = async () => {
  const { templates } = await ensureLibraries();
  return Object.values(templates).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getTemplate = async (id: string) => {
  const { templates } = await ensureLibraries();
  return templates[id] ? clone(templates[id]) : null;
};

export const saveTemplate = async (template: TemplateFileRecord) => {
  const { templates } = await ensureLibraries();
  const saved = { ...clone(template), updatedAt: new Date().toISOString() };
  templates[saved.id] = saved;
  await write(TEMPLATE_FILES_KEY, templates);
  return saved;
};

export const createTemplate = async () => {
  const template = defaultTemplateFile();
  template.id = `template-${Date.now()}`;
  template.name = { de: "Neue Vorlage", en: "New Template" };
  template.description = { de: "", en: "" };
  return saveTemplate(template);
};

const copyId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const copyName = (name: LocalizedText): LocalizedText =>
  Object.fromEntries(Object.entries(name).map(([locale, value]) => [locale, `${value} copy`])) as LocalizedText;

const copyDataName = (name: string) => `${name} copy`;

export const duplicateTemplate = async (id: string) => {
  const template = await getTemplate(id);
  if (!template) return null;

  return saveTemplate({
    ...template,
    id: copyId("template"),
    name: copyName(template.name)
  });
};

export const deleteTemplate = async (id: string) => {
  const { templates } = await ensureLibraries();
  if (!templates[id]) return false;
  delete templates[id];
  await write(TEMPLATE_FILES_KEY, templates);
  return true;
};

export const getDataList = async () => {
  const { data } = await ensureLibraries();
  return Object.values(data).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getData = async (id: string) => {
  const { data } = await ensureLibraries();
  return data[id] ? clone(data[id]) : null;
};

export const saveData = async (record: DataRecord) => {
  const { data } = await ensureLibraries();
  const saved = { ...clone(record), updatedAt: new Date().toISOString() };
  data[saved.id] = saved;
  await write(DATA_FILES_KEY, data);
  return saved;
};

const coerceLocalizedText = (value: unknown, fallback: string): LocalizedText => {
  if (isLocalizedString(value)) return value;
  if (typeof value === "string") return { en: value };
  return { en: fallback };
};

const normalizeImportedDataRecord = (record: unknown): DataRecord | null => {
  if (!isRecord(record)) return null;

  const source = record as Partial<DataRecord> & Record<string, unknown>;
  const id = typeof source.id === "string" ? source.id : `data-${Date.now()}`;
  const name = normalizeDataName(source.name, id);
  const description = coerceLocalizedText(source.description, "");
  if (!isRecord(source.data)) return null;
  const data = source.data as TemplateData;

  return {
    id,
    name,
    description,
    data,
    updatedAt: typeof source.updatedAt === "string" ? source.updatedAt : new Date().toISOString()
  };
};

export const importDataRecordsFromJson = async (content: string) => {
  const parsed = JSON.parse(content) as unknown;
  const entries: unknown[] = [];

  if (Array.isArray(parsed)) entries.push(...parsed);
  else if (isRecord(parsed)) {
    if ("data" in parsed || "id" in parsed) entries.push(parsed);
    else if ("locale" in parsed && "profile" in parsed) entries.push({ data: parsed });
    else entries.push(...Object.values(parsed));
  }

  const records = entries
    .map((entry) => normalizeImportedDataRecord(entry))
    .filter((entry): entry is DataRecord => Boolean(entry));

  if (!records.length) throw new Error("No valid data records found in the JSON file.");

  for (const record of records) await saveData(record);
  return records;
};

export const exportDataRecordAsJson = (record: DataRecord) => {
  const data = clone(record.data);

  const candidateName = String(
    record.name || record.id || "resume-data"
  ).trim();
  const filename = `${candidateName.replace(/\s+/g, "-").toLowerCase() || "resume-data"}.json`;

  downloadFile(filename, JSON.stringify(data, null, 2));
};

export const createData = async () => {
  const record = defaultDataFile();
  record.id = `data-${Date.now()}`;
  record.name = "New Data";
  record.description = { de: "", en: "" };
  return saveData(record);
};

export const duplicateData = async (id: string) => {
  const record = await getData(id);
  if (!record) return null;

  return saveData({
    ...record,
    id: copyId("data"),
    name: copyDataName(record.name)
  });
};

export const deleteData = async (id: string) => {
  const { data } = await ensureLibraries();
  if (!data[id]) return false;
  delete data[id];
  await write(DATA_FILES_KEY, data);
  return true;
};

export { DEFAULT_DATA_ID, DEFAULT_TEMPLATE_ID };

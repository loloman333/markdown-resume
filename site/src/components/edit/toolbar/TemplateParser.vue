<template>
  <Dialog
    id="template-parser"
    title="Template Parser"
    icon="i-carbon:template"
    box-class="w-full max-w-3xl max-h-[90vh]"
  >
    <template #button>
      <li class="dropdown-li space-x-1.5 rounded" role="button">
        <span i-carbon:template text-base />
        <span>Generate from template</span>
      </li>
    </template>

    <template #content>
      <div class="template-parser-content">
        <div class="template-parser-toolbar">
          <label class="template-parser-field template-parser-template-field">
            <span>Template file</span>
            <select v-model="selectedTemplateId">
              <option
                v-for="template in templates"
                :key="template.id"
                :value="template.id"
              >
                {{ localized(template.name) }}
              </option>
            </select>
          </label>
          <label class="template-parser-field template-parser-template-field">
            <span>Data file</span>
            <select v-model="selectedDataId">
              <option v-for="record in dataRecords" :key="record.id" :value="record.id">
                {{ record.name }}
              </option>
            </select>
          </label>
          <label class="template-parser-field">
            <span>Language</span>
            <select v-model="resume.locale">
              <option v-for="locale in locales" :key="locale" :value="locale">
                {{ locale.toUpperCase() }}
              </option>
            </select>
          </label>
        </div>

        <div v-if="resume" class="template-parser-editor">
          <TemplateDataField
            v-model="resume"
            field-name="Resume data"
            path="$"
            :locales="locales"
            :locale="resume.locale"
            :selection="selection"
            :root="true"
          />
        </div>

        <div v-if="warnings.length" class="template-parser-warnings" role="status">
          <strong>Translation warnings</strong>
          <div v-for="warning in warnings" :key="warning">{{ warning }}</div>
        </div>

        <div class="template-parser-actions">
          <span v-if="generated" class="template-parser-status"
            >Markdown loaded into editor</span
          >
          <button
            class="rect-btn text-white"
            bg="blue-500 hover:(blue-600 dark:blue-400)"
            type="button"
            @click="generate"
          >
            <span i-carbon:document-add />
            <span>Generate and load Markdown</span>
          </button>
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script lang="ts" setup>
import { toRaw } from "vue";
import {
  parseTemplate,
  type TemplateData,
  type TemplateValue
} from "~/utils/templateParser";
import {
  getDataList,
  getTemplateList,
  saveData,
  type DataRecord,
  type TemplateFileRecord
} from "~/utils/templateLibrary";

const templates = ref<TemplateFileRecord[]>([]);
const dataRecords = ref<DataRecord[]>([]);
const selectedTemplateId = ref("");
const selectedDataId = ref("");
const resume = ref<TemplateData | null>(null);
const selection = reactive<Record<string, boolean>>({});
const warnings = ref<string[]>([]);
const generated = ref(false);
const locales = computed(() => (resume.value ? inferLocales(resume.value) : []));
const selectedTemplate = computed(() =>
  templates.value.find((template) => template.id === selectedTemplateId.value)
);
const selectedData = computed(() =>
  dataRecords.value.find((record) => record.id === selectedDataId.value)
);

const isLocalizedString = (value: TemplateValue): value is Record<string, string> =>
  typeof value === "object" &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((item) => typeof item === "string");

const inferLocales = (value: TemplateValue): string[] => {
  const found = new Set<string>();
  const visit = (item: TemplateValue) => {
    if (isLocalizedString(item)) Object.keys(item).forEach((locale) => found.add(locale));
    else if (Array.isArray(item)) item.forEach(visit);
    else if (typeof item === "object" && item !== null)
      Object.values(item).forEach(visit);
  };
  visit(value);
  return [...found].sort();
};

const localized = (value: TemplateValue) => {
  if (typeof value === "string") return value;
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "";

  const locale = String(resume.value?.locale || "en");
  const values = value as Record<string, TemplateValue>;
  return String(values[locale] ?? values.en ?? Object.values(values)[0] ?? "");
};

const selectedFor = (path: string) => selection[path] ?? true;

const decorateSelection = (value: TemplateValue, path = ""): TemplateValue => {
  if (Array.isArray(value)) {
    return value.map((item, index) => decorateSelection(item, `${path}[${index}]`));
  }
  if (typeof value !== "object" || value === null || isLocalizedString(value))
    return value;

  const decorated = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      decorateSelection(item, path ? `${path}.${key}` : key)
    ])
  );
  if (path && path !== "locale") decorated.enabled = selectedFor(path);
  return decorated;
};

const resetSelection = (value: TemplateValue, path = "") => {
  if (Array.isArray(value))
    value.forEach((item, index) => resetSelection(item, `${path}[${index}]`));
  else if (typeof value === "object" && value !== null && !isLocalizedString(value)) {
    if (path && path !== "locale") {
      const record = value as Record<string, TemplateValue>;
      selection[path] = record.enabled !== false;
    }
    Object.entries(value).forEach(([key, item]) =>
      resetSelection(item, path ? `${path}.${key}` : key)
    );
  }
};

const generate = async () => {
  if (!resume.value || !selectedTemplate.value) return;
  const generatedData = decorateSelection(
    structuredClone(toRaw(resume.value))
  ) as TemplateData;
  const result = parseTemplate(
    selectedTemplate.value.content,
    generatedData,
    selectedTemplate.value.partials,
    String(resume.value.locale)
  );

  const selected = selectedData.value;
  if (selected) {
    const savedData = { ...toRaw(selected), data: structuredClone(toRaw(resume.value)) };
    await saveData(savedData);
    const index = dataRecords.value.findIndex((record) => record.id === selected.id);
    if (index >= 0)
      dataRecords.value[index] = savedData;
  }
  setResumeMd(result.output);
  warnings.value = result.warnings;
  generated.value = true;
};

watch(selectedDataId, () => {
  const selected = selectedData.value;
  if (!selected) return;
  resume.value = structuredClone(toRaw(selected.data));
  Object.keys(selection).forEach((path) => delete selection[path]);
  resetSelection(resume.value);
  warnings.value = [];
  generated.value = false;
});

onMounted(async () => {
  [templates.value, dataRecords.value] = await Promise.all([
    getTemplateList(),
    getDataList()
  ]);
  selectedTemplateId.value = templates.value[0]?.id || "";
  selectedDataId.value = dataRecords.value[0]?.id || "";
});
</script>

<style scoped>
.template-parser-content {
  @apply min-h-0 overflow-y-auto p-4 text-sm;
}

.template-parser-toolbar {
  @apply flex flex-wrap items-end gap-4 border-b border-c pb-4;
}

.template-parser-field,
.template-parser-check,
.template-parser-entry,
.template-parser-section-title {
  @apply flex items-center gap-2;
}

.template-parser-field {
  @apply flex-col items-start gap-1;
}

.template-parser-template-field {
  @apply min-w-48;
}

.template-parser-field select {
  @apply rounded border border-c bg-c px-2 py-1;
}

.template-parser-editor {
  @apply py-4;
}

.template-parser-warnings {
  @apply mb-4 rounded border border-yellow-500/50 bg-yellow-500/10 p-3 text-xs;
}

.template-parser-actions {
  @apply flex flex-wrap items-center justify-between gap-3 border-t border-c pt-4;
}

.template-parser-status {
  @apply text-xs text-green-600 dark:text-green-400;
}
</style>

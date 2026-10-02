<template>
  <div class="data-page sidebar-layout">
    <Header />
    <main class="data-main">
      <div class="data-heading">
        <div>
          <div class="data-kicker">Workspace</div>
          <h1>My Data</h1>
          <p>Manage structured JSON resume data independently from Markdown templates.</p>
        </div>
        <div class="data-heading-actions">
          <button class="rect-btn" type="button" @click="importJson">
            <span i-carbon:upload />
            <span>Import JSON</span>
          </button>
          <button class="rect-btn text-white" bg="blue-500 hover:(blue-600 dark:blue-400)" @click="create">
            <span i-carbon:add />
            <span>New data file</span>
          </button>
        </div>
      </div>
      <div v-if="records.length" class="data-grid">
        <article
          v-for="record in records"
          :key="record.id"
          class="data-card"
        >
          <NuxtLink class="data-card-link" :to="editLink(record.id)">
            <div class="data-card-mark"><span i-carbon:json text-2xl /></div>
            <div class="data-card-body">
              <h2>{{ record.name }}</h2>
              <p>{{ localized(record.description) || "No description yet." }}</p>
              <span class="data-card-meta">Updated {{ formatDate(record.updatedAt) }}</span>
            </div>
            <span class="data-card-arrow" i-carbon:arrow-up-right />
          </NuxtLink>
          <div class="data-card-actions">
            <button type="button" title="Duplicate data" @click="duplicate(record.id)"><span i-ion:duplicate /></button>
            <button type="button" title="Delete data" @click="remove(record.id)"><span i-material-symbols:delete-outline-rounded /></button>
          </div>
        </article>
      </div>
      <div v-else class="data-empty">Loading data files...</div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { uploadFile } from "@renovamen/utils";
import {
  createData,
  deleteData,
  duplicateData,
  getDataList,
  importDataRecordsFromJson,
  type DataRecord,
  type LocalizedText
} from "~/utils/templateLibrary";

const localePath = useLocalePath();
const { locale } = useI18n();
const records = ref<DataRecord[]>([]);
const localized = (value: LocalizedText) => value[locale.value] || value.en || Object.values(value)[0] || "";
const formatDate = (value: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: "medium" }).format(new Date(value));
const editLink = (id: string) => ({ path: localePath("/data/edit"), query: { id } });

const load = async () => {
  records.value = await getDataList();
};

const create = async () => {
  const record = await createData();
  await navigateTo(editLink(record.id));
};

const duplicate = async (id: string) => {
  await duplicateData(id);
  await load();
};

const remove = async (id: string) => {
  await deleteData(id);
  await load();
};

const importJson = async () => {
  uploadFile(async (content: string) => {
    try {
      await importDataRecordsFromJson(content);
      await load();
    } catch (error) {
      console.error("Failed to import data JSON", error);
      alert("This file does not contain valid data JSON.");
    }
  }, ".json");
};

onMounted(load);
</script>

<style scoped>
.data-main {
  @apply mx-auto max-w-306 px-5 py-12 md:px-10 md:py-16 text-dark-c;
}

.data-heading {
  @apply mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between;
}

.data-heading-actions {
  @apply flex flex-wrap items-center gap-2;
}

.data-kicker {
  @apply mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-600;
}

.data-heading h1 {
  @apply text-4xl font-bold tracking-tight;
}

.data-heading p {
  @apply mt-2 max-w-xl text-sm text-light-c;
}

.data-grid {
  @apply grid gap-5 md:grid-cols-2 xl:grid-cols-3;
}

.data-card {
  @apply relative min-h-52 rounded-xl border border-c bg-c transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg;
}

.data-card-link {
  @apply flex min-h-52 gap-4 p-5;
}

.data-card-mark {
  @apply flex size-12 flex-none items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300;
}

.data-card-body {
  @apply min-w-0 pr-5;
}

.data-card-body h2 {
  @apply truncate text-lg font-semibold;
}

.data-card-body p {
  @apply mt-2 line-clamp-3 text-sm leading-6 text-light-c;
}

.data-card-meta {
  @apply absolute bottom-5 text-xs text-light-c;
}

.data-card-arrow {
  @apply absolute right-5 top-5 text-lg text-light-c;
}

.data-card-actions {
  @apply absolute right-3 top-3 hidden gap-2;
}

.data-card:hover .data-card-actions,
.data-card:focus-within .data-card-actions {
  @apply flex;
}

.data-card-actions button {
  @apply circle size-8 bg-gray-500/80 text-white hover:bg-gray-500;
}

.data-empty {
  @apply rounded-xl border border-dashed border-c p-12 text-center text-sm text-light-c;
}
</style>

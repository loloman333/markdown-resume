<template>
  <div class="templates-page sidebar-layout">
    <Header />

    <main class="templates-main">
      <div class="templates-heading">
        <div>
          <div class="templates-kicker">Workspace</div>
          <h1>Templates</h1>
          <p>Manage Markdown template files used to generate resumes.</p>
        </div>
        <button class="rect-btn text-white" bg="blue-500 hover:(blue-600 dark:blue-400)" @click="create">
          <span i-carbon:add />
          <span>New template file</span>
        </button>
      </div>

      <div v-if="templates.length" class="templates-grid">
        <article
          v-for="template in templates"
          :key="template.id"
          class="template-card"
        >
          <NuxtLink class="template-card-link" :to="templateEditLink(template.id)">
            <div class="template-card-mark"><span i-carbon:template text-2xl /></div>
            <div class="template-card-body">
              <h2>{{ localized(template.name) }}</h2>
              <p>{{ localized(template.description) || "No description yet." }}</p>
              <span class="template-card-meta">Updated {{ formatDate(template.updatedAt) }}</span>
            </div>
            <span class="template-card-arrow" i-carbon:arrow-up-right />
          </NuxtLink>
          <div class="template-card-actions">
            <button type="button" title="Duplicate template" @click="duplicate(template.id)"><span i-ion:duplicate /></button>
            <button type="button" title="Delete template" @click="remove(template.id)"><span i-material-symbols:delete-outline-rounded /></button>
          </div>
        </article>
      </div>

      <div v-else class="templates-empty">Loading templates...</div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import type { LocalizedText, TemplateFileRecord } from "~/utils/templateLibrary";

const localePath = useLocalePath();
const templates = ref<TemplateFileRecord[]>([]);
const currentLocale = computed(() => useI18n().locale.value);

const localized = (value: LocalizedText) =>
  value[currentLocale.value] || value.en || Object.values(value)[0] || "";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(currentLocale.value, { dateStyle: "medium" }).format(new Date(value));

const load = async () => {
  templates.value = await getTemplateList();
};

const create = async () => {
  const template = await createTemplate();
  await navigateTo(templateEditLink(template.id));
};

const duplicate = async (id: string) => {
  await duplicateTemplate(id);
  await load();
};

const remove = async (id: string) => {
  await deleteTemplate(id);
  await load();
};

const templateEditLink = (id: string) => ({
  path: localePath("/templates/edit"),
  query: { id }
});

onMounted(load);
</script>

<style scoped>
.templates-main {
  @apply mx-auto max-w-306 px-5 py-12 md:px-10 md:py-16 text-dark-c;
}

.templates-heading {
  @apply mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between;
}

.templates-kicker {
  @apply mb-2 text-xs font-semibold uppercase tracking-widest text-blue-600;
}

.templates-heading h1 {
  @apply text-4xl font-bold tracking-tight;
}

.templates-heading p {
  @apply mt-2 max-w-xl text-sm text-light-c;
}

.templates-grid {
  @apply grid gap-5 md:grid-cols-2 xl:grid-cols-3;
}

.template-card {
  @apply relative min-h-52 rounded-xl border border-c bg-c transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg;
}

.template-card-link {
  @apply flex min-h-52 gap-4 p-5;
}

.template-card-mark {
  @apply flex size-12 flex-none items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300;
}

.template-card-body {
  @apply min-w-0 pr-5;
}

.template-card-body h2 {
  @apply truncate text-lg font-semibold;
}

.template-card-body p {
  @apply mt-2 line-clamp-3 text-sm leading-6 text-light-c;
}

.template-card-meta {
  @apply absolute bottom-5 text-xs text-light-c;
}

.template-card-arrow {
  @apply absolute right-5 top-5 text-lg text-light-c;
}

.template-card-actions {
  @apply absolute right-3 top-3 hidden gap-2;
}

.template-card:hover .template-card-actions,
.template-card:focus-within .template-card-actions {
  @apply flex;
}

.template-card-actions button {
  @apply circle size-8 bg-gray-500/80 text-white hover:bg-gray-500;
}

.templates-empty {
  @apply rounded-xl border border-dashed border-c p-12 text-center text-sm text-light-c;
}
</style>
<template>
  <div class="home-page sidebar-layout">
    <Header />

    <main class="max-w-306 mx-auto px-5 py-12 md:px-10 md:py-16 text-dark-c">

      <!-- Hero Section -->
      <section class="mb-14 text-center">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">
          <span class="text-brand">Markdown</span> Resume
        </h1>
        <p class="text-lg text-light-c max-w-3xl mx-auto">
          Free online resume maker, allows you to create your resume in minutes with Markdown!
        </p>
      </section>

      <!-- Recent Resumes Section -->
      <section class="mb-14">
        <div class="flex items-center justify-between mb-6">
          <div class="hstack gap-3">
            <span class="circle size-9 flex-shrink-0 bg-brand text-white">
              <span i-ep:document text-lg />
            </span>
            <div>
              <h2 class="text-2xl font-bold">{{ $t("resumes.my_resumes") }}</h2>
              <p class="mt-0.5 text-sm text-light-c">{{ $t("resumes.description") }}</p>
            </div>
          </div>
          <nuxt-link
            class="hstack gap-1.5 px-4 py-2 rounded-lg border border-c text-sm font-medium hover:bg-darker-c transition-colors"
            :to="$nuxt.$localePath('/resumes')"
          >
            <span>{{ $t("nav.see_more") }}</span>
            <span i-tabler:arrow-right text-base />
          </nuxt-link>
        </div>

        <div class="resumes-row-wrap">
          <div class="resumes-row">
            <NewResume />
            <ResumeItem
              v-for="resume in recentResumes"
              :key="resume.id"
              class="resume-item flex-shrink-0"
              :resume="resume"
              @update="loadResumes"
            />
          </div>
        </div>
      </section>

      <!-- Recent Templates Section -->
      <section class="mb-14">
        <div class="flex items-center justify-between mb-6">
          <div class="hstack gap-3">
            <span class="circle size-9 flex-shrink-0 bg-blue-500 text-white">
              <span i-carbon:template text-lg />
            </span>
            <div>
              <h2 class="text-2xl font-bold">My Templates</h2>
              <p class="mt-0.5 text-sm text-light-c">Markdown files used to generate resumes.</p>
            </div>
          </div>
          <nuxt-link class="hstack gap-1.5 px-4 py-2 rounded-lg border border-c text-sm font-medium hover:bg-darker-c transition-colors" :to="$nuxt.$localePath('/templates')">
            <span>See all</span>
            <span i-tabler:arrow-right text-base />
          </nuxt-link>
        </div>
        <div class="home-file-row">
          <nuxt-link v-for="template in recentTemplates" :key="template.id" class="home-file-card" :to="{ path: $nuxt.$localePath('/templates/edit'), query: { id: template.id } }">
            <span class="home-file-icon home-file-icon-template"><span i-carbon:template /></span>
            <span class="min-w-0"><strong>{{ localized(template.name) }}</strong><small>{{ localized(template.description) }}</small></span>
          </nuxt-link>
        </div>
      </section>

      <!-- Recent Data Section -->
      <section class="mb-14">
        <div class="flex items-center justify-between mb-6">
          <div class="hstack gap-3">
            <span class="circle size-9 flex-shrink-0 bg-emerald-500 text-white">
              <span i-carbon:json-reference text-lg />
            </span>
            <div>
              <h2 class="text-2xl font-bold">My Data</h2>
              <p class="mt-0.5 text-sm text-light-c">Structured JSON content for your resumes.</p>
            </div>
          </div>
          <nuxt-link class="hstack gap-1.5 px-4 py-2 rounded-lg border border-c text-sm font-medium hover:bg-darker-c transition-colors" :to="$nuxt.$localePath('/data')">
            <span>See all</span>
            <span i-tabler:arrow-right text-base />
          </nuxt-link>
        </div>
        <div class="home-file-row">
          <nuxt-link v-for="record in recentData" :key="record.id" class="home-file-card" :to="{ path: $nuxt.$localePath('/data/edit'), query: { id: record.id } }">
            <span class="home-file-icon home-file-icon-data"><span i-carbon:json-reference /></span>
            <span class="min-w-0"><strong>{{ record.name }}</strong><small>{{ localized(record.description) }}</small></span>
          </nuxt-link>
        </div>
      </section>

      <!-- Recent Images Section -->
      <section>
        <div class="flex items-center justify-between mb-6">
          <div class="hstack gap-3">
            <span class="circle size-9 flex-shrink-0 bg-brand text-white">
              <span i-ic:outline-photo-library text-lg />
            </span>
            <div>
              <h2 class="text-2xl font-bold">{{ $t("images.my_images") }}</h2>
              <p class="mt-0.5 text-sm text-light-c">{{ $t("images.description") }}</p>
            </div>
          </div>
          <nuxt-link
            class="hstack gap-1.5 px-4 py-2 rounded-lg border border-c text-sm font-medium hover:bg-darker-c transition-colors"
            :to="$nuxt.$localePath('/images')"
          >
            <span>{{ $t("nav.see_more") }}</span>
            <span i-tabler:arrow-right text-base />
          </nuxt-link>
        </div>

        <div v-if="recentImages && recentImages.length > 0" class="images-row-wrap">
          <div class="images-row">
            <ImageItem
              v-for="image in recentImages"
              :key="image.id"
              class="flex-shrink-0"
              :image="image"
              @update="loadImages"
            />
          </div>
        </div>

        <div
          v-else-if="recentImages && recentImages.length === 0"
          class="mt-8 flex-center flex-col gap-3 text-lighter-c py-12 rounded-xl border border-dashed border-c"
        >
          <span i-ic:outline-photo-library text-5xl />
          <p text-sm>{{ $t("images.empty") }}</p>
          <nuxt-link
            class="hstack gap-1.5 px-4 py-1.5 rounded-lg bg-brand text-white text-sm hover:opacity-90 transition-opacity"
            :to="$nuxt.$localePath('/images')"
          >
            <span i-ic:round-upload-file />
            <span>{{ $t("images.upload") }}</span>
          </nuxt-link>
        </div>
      </section>

    </main>
  </div>
</template>

<script lang="ts" setup>
import type { ResumeListItem, ImageListItem } from "~/types";
import type { DataRecord, LocalizedText, TemplateFileRecord } from "~/utils/templateLibrary";

const RECENT_COUNT = 5;

const resumeList = ref<ResumeListItem[]>();
const imageList = ref<ImageListItem[]>();
const templateList = ref<TemplateFileRecord[]>();
const dataList = ref<DataRecord[]>();

const recentResumes = computed(() => resumeList.value?.slice(0, RECENT_COUNT));
const recentImages = computed(() => imageList.value?.slice(0, RECENT_COUNT));
const recentTemplates = computed(() => templateList.value?.slice(0, RECENT_COUNT));
const recentData = computed(() => dataList.value?.slice(0, RECENT_COUNT));
const { locale } = useI18n();
const localized = (value: LocalizedText) => value[locale.value] || value.en || Object.values(value)[0] || "";

const loadResumes = async () => {
  resumeList.value = await getResumeList();
};

const loadImages = async () => {
  imageList.value = await getImageList(false);
};

const loadTemplates = async () => {
  templateList.value = await getTemplateList();
};

const loadData = async () => {
  dataList.value = await getDataList();
};

onMounted(async () => {
  await Promise.all([loadResumes(), loadImages(), loadTemplates(), loadData()]);
});
</script>

<style scoped>
.home-page :deep(.resume-card) {
  border-color: #d1d5db !important;
  color-scheme: light;
}

.home-page :deep(.resume-card .vue-smart-pages) {
  background-color: white !important;
  color: black !important;
}

.home-page :deep(button.resume-card) {
  background-color: #e5e7eb !important;
}

.home-page :deep(button.resume-card:hover) {
  background-color: white !important;
}

/* Wrapper allows horizontal scroll while keeping overflow-y visible so
   the translate-up hover and drop-shadow on cards are not clipped */
.resumes-row-wrap,
.images-row-wrap {
  @apply overflow-x-auto overflow-y-visible pt-3 -mt-3 pb-3 pr-3 [scrollbar-width:thin];
}

.resumes-row {
  @apply flex flex-nowrap gap-4 pr-3;
}

.images-row {
  @apply flex flex-nowrap gap-6 pr-3;
}

.home-file-row {
  @apply grid gap-4 md:grid-cols-2 xl:grid-cols-3;
}

.home-file-card {
  @apply flex min-w-0 items-center gap-3 rounded-xl border border-c bg-c p-4 transition hover:-translate-y-0.5 hover:shadow-lg;
}

.home-file-card strong,
.home-file-card small {
  @apply block truncate;
}

.home-file-card strong {
  @apply text-sm font-semibold;
}

.home-file-card small {
  @apply mt-1 text-xs text-light-c;
}

.home-file-icon {
  @apply flex size-10 flex-none items-center justify-center rounded-lg;
}

.home-file-icon-template {
  @apply bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300;
}

.home-file-icon-data {
  @apply bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300;
}
</style>

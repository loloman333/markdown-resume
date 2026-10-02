<template>
  <div class="template-detail-page sidebar-layout">
    <Header />
    <main class="template-detail-main">
      <TemplateFileEditor v-if="template" :template="template" @saved="template = $event" />
      <div v-else class="template-detail-loading">Loading template...</div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import type { TemplateFileRecord } from "~/utils/templateLibrary";

const route = useRoute();
const localePath = useLocalePath();
const template = ref<TemplateFileRecord | null>(null);

onMounted(async () => {
  const id = String(route.query.id || "");
  template.value = id ? await getTemplate(id) : null;
  if (!template.value) await navigateTo(localePath("/templates"));
});
</script>

<style scoped>
.template-detail-main {
  @apply mx-auto max-w-320 px-5 py-8 md:px-10 md:py-12 text-dark-c;
}

.template-detail-loading {
  @apply p-12 text-center text-sm text-light-c;
}
</style>
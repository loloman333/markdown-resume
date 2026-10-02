<template>
  <div class="data-detail-page sidebar-layout">
    <Header />
    <main class="data-detail-main">
      <TemplateEditor v-if="record" :template="record" @saved="record = $event" />
      <div v-else class="data-detail-loading">Loading data file...</div>
    </main>
  </div>
</template>

<script lang="ts" setup>
import type { DataRecord } from "~/utils/templateLibrary";

const route = useRoute();
const localePath = useLocalePath();
const record = ref<DataRecord | null>(null);

onMounted(async () => {
  const id = String(route.query.id || "");
  record.value = id ? await getData(id) : null;
  if (!record.value) await navigateTo(localePath("/data"));
});
</script>

<style scoped>
.data-detail-main {
  @apply mx-auto max-w-320 px-5 py-8 md:px-10 md:py-12 text-dark-c;
}

.data-detail-loading {
  @apply p-12 text-center text-sm text-light-c;
}
</style>

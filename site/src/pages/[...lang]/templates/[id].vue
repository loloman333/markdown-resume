<template>
  <div class="template-detail-page sidebar-layout">
    <Header />
    <main class="template-detail-main" />
  </div>
</template>

<script lang="ts" setup>
const route = useRoute();

onMounted(async () => {
  await navigateTo({
    path: useLocalePath()("/templates/edit"),
    query: { id: String(route.params.id) }
  });
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
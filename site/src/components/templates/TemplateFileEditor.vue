<template>
  <div class="template-file-editor">
    <div class="template-editor-header">
      <div>
        <NuxtLink class="template-editor-back" :to="localePath('/templates')">
          <span i-carbon:arrow-left /> My Templates
        </NuxtLink>
        <h1>Template file editor</h1>
        <p>Edit the Markdown template source. Rendering and parsing are intentionally separate.</p>
      </div>
      <div class="template-editor-actions">
        <button class="rect-btn" type="button" @click="save"><span i-carbon:save /> Save</button>
        <button class="rect-btn text-red-700" type="button" @click="remove">
          <span i-carbon:trash-can /> Delete
        </button>
      </div>
    </div>

    <section class="template-file-meta">
      <label>
        <span>Name</span>
        <input v-model="template.name.en" type="text" />
      </label>
      <label>
        <span>Description</span>
        <input v-model="template.description.en" type="text" />
      </label>
    </section>

    <section ref="editorElement" class="template-source-editor" aria-label="Markdown template source" />
  </div>
</template>

<script lang="ts" setup>
import { toRaw } from "vue";
import type * as Monaco from "monaco-editor";
import type { TemplateFileRecord } from "~/utils/templateLibrary";
import { deleteTemplate, saveTemplate } from "~/utils/templateLibrary";
import { setupMonaco } from "~/monaco";

const props = defineProps<{ template: TemplateFileRecord }>();
const emit = defineEmits<{ (event: "saved", template: TemplateFileRecord): void }>();
const localePath = useLocalePath();
const template = reactive(structuredClone(toRaw(props.template)));
const editorElement = ref<HTMLDivElement>();
let editor: Monaco.editor.IStandaloneCodeEditor | undefined;
let model: Monaco.editor.ITextModel | undefined;

onMounted(async () => {
  if (!editorElement.value) return;
  const { monaco } = await setupMonaco();
  model = monaco.editor.createModel(template.content, "markdown");
  editor = monaco.editor.create(editorElement.value, {
    automaticLayout: true,
    fontSize: 13,
    lineHeight: 1.5,
    minimap: { enabled: false },
    wordWrap: "on"
  });
  editor.setModel(model);
});

onBeforeUnmount(() => {
  editor?.dispose();
  model?.dispose();
});

const save = async () => {
  const record = structuredClone(toRaw(template));
  record.content = model?.getValue() ?? record.content;
  const saved = await saveTemplate(record);
  emit("saved", saved);
};

const remove = async () => {
  if (!confirm("Delete this template file?")) return;
  await deleteTemplate(template.id);
  await navigateTo(localePath("/templates"));
};
</script>

<style scoped>
.template-file-editor {
  @apply min-h-[calc(100vh-6rem)];
}

.template-editor-header {
  @apply mb-8 flex flex-col gap-5 border-b border-c pb-7 md:flex-row md:items-end md:justify-between;
}

.template-editor-back {
  @apply mb-4 flex items-center gap-2 text-sm text-blue-600 hover:underline;
}

.template-editor-header h1 {
  @apply text-3xl font-bold tracking-tight;
}

.template-editor-header p {
  @apply mt-2 text-sm text-light-c;
}

.template-editor-actions {
  @apply flex gap-2;
}

.template-file-meta {
  @apply mb-5 grid gap-4 rounded-xl border border-c bg-c p-5 md:grid-cols-2;
}

.template-file-meta label {
  @apply flex flex-col gap-1.5 text-sm;
}

.template-file-meta span {
  @apply text-xs font-medium text-light-c;
}

.template-file-meta input {
  @apply rounded-md border border-c bg-transparent px-3 py-2 outline-none focus:border-blue-500;
}

.template-source-editor {
  @apply h-[calc(100vh-18rem)] min-h-[32rem] overflow-hidden rounded-xl border border-c;
}
</style>

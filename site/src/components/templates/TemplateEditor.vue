<template>
  <div class="template-editor">
    <div class="template-editor-header">
      <div class="template-editor-heading">
        <NuxtLink class="template-editor-back" :to="localePath('/data')">
          <span i-carbon:arrow-left /> My Data
        </NuxtLink>
        <h1>Data editor</h1>
        <p>Edit structured resume content, translations, ordering, and visibility.</p>
        <div class="template-editor-meta">
          <label class="editor-field">
            <span>Name</span>
            <input v-model="template.name" type="text" />
          </label>
          <label class="editor-field">
            <span>Description ({{ activeLocale }})</span>
            <input v-model="template.description[activeLocale]" type="text" />
          </label>
        </div>
        <div class="editor-language-bar">
          <div class="locale-row">
            <span class="locale-label">Content languages</span>
            <button
              v-for="locale in locales"
              :key="locale"
              class="locale-button"
              :class="{ 'locale-button-active': locale === activeLocale }"
              type="button"
              @click="activeLocale = locale"
            >
              {{ locale.toUpperCase() }}
            </button>
            <input v-model="newLocale" class="locale-input" maxlength="8" placeholder="e.g. fr" />
            <button class="icon-action" type="button" title="Add language" @click="addLocale">
              <span i-carbon:add />
            </button>
          </div>
        </div>
      </div>
      <div class="template-editor-actions">
        <button class="rect-btn" type="button" @click="save"><span i-carbon:save /> Save</button>
        <button class="rect-btn" type="button" @click="exportJson"><span i-carbon:download /> Export JSON</button>
        <button class="rect-btn text-red-700" type="button" @click="remove">
          <span i-carbon:trash-can /> Delete
        </button>
        <button class="rect-btn" type="button" @click="toggleAll">
          <span i-carbon:collapse-categories />
          <span>{{ allCollapsed ? "Expand all" : "Collapse all" }}</span>
        </button>
      </div>
    </div>

    <details :ref="(element) => setSectionRef('profile', element)" class="editor-panel" @toggle="syncCollapseState">
      <summary class="editor-panel-heading editor-panel-summary"><span i-carbon:user /> Profile</summary>
      <div class="section-entry-actions">
        <button class="small-action" type="button" @click.stop="toggleSectionEntries('profile')">
          <span i-carbon:collapse-categories />
          <span>{{ sectionEntriesCollapsed.profile ? "Expand entries" : "Collapse entries" }}</span>
        </button>
      </div>
      <label class="editor-field editor-wide-field">
        <span>Name ({{ activeLocale }})</span>
        <input v-model="template.data.profile.name[activeLocale]" type="text" />
      </label>
      <div class="editor-subsection">
        <div class="editor-subheading">Profile info</div>
        <details v-for="(item, index) in template.data.profile.profileInfo" :key="item.id" class="entry-card section-entry" @toggle="syncSectionEntryState('profile')">
          <summary class="entry-summary">
            <span>{{ localized(item.text) || "Profile info" }}</span>
            <span class="entry-summary-controls" @click.stop>
              <EntryControls :enabled="item.enabled" :index="index" :length="template.data.profile.profileInfo.length" @update:enabled="item.enabled = $event" @up="move(template.data.profile.profileInfo, index, -1)" @down="move(template.data.profile.profileInfo, index, 1)" @remove="removeAt(template.data.profile.profileInfo, index)" />
            </span>
          </summary>
          <div class="editor-form-grid editor-form-grid-3">
            <label class="editor-field"><span>Text ({{ activeLocale }})</span><input v-model="item.text[activeLocale]" type="text" /></label>
            <label class="editor-field"><span>URL</span><input v-model="item.url" placeholder="Optional" type="url" /></label>
            <label class="editor-field"><span>Iconify icon</span><input v-model="item.icon" placeholder="tabler:mail" type="text" /></label>
          </div>
        </details>
        <button class="small-action" type="button" @click="addProfileInfo"><span i-carbon:add /> Add profile info</button>
      </div>
      <div class="editor-subsection">
        <div class="editor-subheading">Photo</div>
        <div class="editor-form-grid">
          <label class="editor-field"><span>Image path</span><input v-model="template.data.profile.photo.src" type="text" /></label>
          <label class="field-inline editor-photo-toggle"><input v-model="template.data.profile.photo.enabled" type="checkbox" /> visible</label>
        </div>
      </div>
    </details>

    <details :ref="(element) => setSectionRef('layout', element)" class="editor-panel" @toggle="syncCollapseState">
      <summary class="editor-panel-heading editor-panel-summary"><span i-carbon:layout /> Layout</summary>
      <label class="field-inline">
        <input v-model="template.data.layout.skillsAndHobbiesTwoColumn" type="checkbox" />
        Use two columns for skills and hobbies
      </label>
    </details>

    <details :ref="(element) => setSectionRef(section.key, element)" v-for="section in sectionDefinitions" :key="section.key" class="editor-panel" @toggle="syncCollapseState">
      <summary class="editor-panel-heading editor-panel-summary">
        <span :class="section.icon" />
        <label class="section-title-toggle">
          <input v-model="template.data[section.key].enabled" type="checkbox" />
          {{ localized(template.data[section.key].title) }}
        </label>
      </summary>
      <div class="section-entry-actions">
        <button class="small-action" type="button" @click.stop="toggleSectionEntries(section.key)">
          <span i-carbon:collapse-categories />
          <span>{{ sectionEntriesCollapsed[section.key] ? "Expand entries" : "Collapse entries" }}</span>
        </button>
      </div>
      <label class="editor-field editor-wide-field">
        <span>Section title ({{ activeLocale }})</span>
        <input v-model="template.data[section.key].title[activeLocale]" type="text" />
      </label>

      <div v-if="section.key === 'education'" class="editor-entries">
        <details v-for="(entry, index) in template.data.education.entries" :key="entry.id" class="entry-card section-entry" @toggle="syncSectionEntryState('education')">
          <summary class="entry-summary">
            <span>{{ localized(entry.degree) || "Education entry" }}</span>
            <span class="entry-summary-controls" @click.stop>
              <EntryControls :enabled="entry.enabled" :index="index" :length="template.data.education.entries.length" @update:enabled="entry.enabled = $event" @up="move(template.data.education.entries, index, -1)" @down="move(template.data.education.entries, index, 1)" @remove="removeAt(template.data.education.entries, index)" />
            </span>
          </summary>
          <div class="editor-form-grid">
            <label class="editor-field"><span>Degree ({{ activeLocale }})</span><input v-model="entry.degree[activeLocale]" type="text" /></label>
            <label class="editor-field"><span>Period ({{ activeLocale }})</span><input v-model="entry.period[activeLocale]" type="text" /></label>
          </div>
          <label v-for="(institution, institutionIndex) in entry.institutions" :key="institutionIndex" class="editor-field editor-inline-field"><span>Institution</span><input v-model="institution.name[activeLocale]" type="text" /></label>
          <button class="small-action" type="button" @click="addInstitution(entry)"><span i-carbon:add /> Add institution</button>
        </details>
        <button class="small-action" type="button" @click="addEducation"><span i-carbon:add /> Add education</button>
      </div>

      <div v-if="section.key === 'experience'" class="editor-entries">
        <details v-for="(entry, index) in template.data.experience.entries" :key="entry.id" class="entry-card section-entry" @toggle="syncSectionEntryState('experience')">
          <summary class="entry-summary">
            <span>{{ localized(entry.role) || "Experience entry" }}</span>
            <span class="entry-summary-controls" @click.stop>
              <EntryControls :enabled="entry.enabled" :index="index" :length="template.data.experience.entries.length" @update:enabled="entry.enabled = $event" @up="move(template.data.experience.entries, index, -1)" @down="move(template.data.experience.entries, index, 1)" @remove="removeAt(template.data.experience.entries, index)" />
            </span>
          </summary>
          <div class="editor-form-grid">
            <label class="editor-field"><span>Role ({{ activeLocale }})</span><input v-model="entry.role[activeLocale]" type="text" /></label>
            <label class="editor-field"><span>Period ({{ activeLocale }})</span><input v-model="entry.period[activeLocale]" type="text" /></label>
          </div>
          <label v-for="(bullet, bulletIndex) in entry.bullets" :key="bulletIndex" class="editor-field editor-inline-field"><span>Bullet</span><input v-model="bullet.text[activeLocale]" type="text" /></label>
          <button class="small-action" type="button" @click="entry.bullets.push({ text: localizedMap() })"><span i-carbon:add /> Add bullet</button>
        </details>
        <button class="small-action" type="button" @click="addExperience"><span i-carbon:add /> Add experience</button>
      </div>

      <div v-if="section.key === 'skills'" class="editor-entries">
        <details v-for="(entry, index) in template.data.skills.entries" :key="entry.id" class="entry-card section-entry compact-entry-card" @toggle="syncSectionEntryState('skills')">
          <summary class="entry-summary">
            <span>{{ localized(entry.label) || "Skill entry" }}</span>
            <span class="entry-summary-controls" @click.stop>
              <EntryControls :enabled="entry.enabled" :index="index" :length="template.data.skills.entries.length" @update:enabled="entry.enabled = $event" @up="move(template.data.skills.entries, index, -1)" @down="move(template.data.skills.entries, index, 1)" @remove="removeAt(template.data.skills.entries, index)" />
            </span>
          </summary>
          <div class="editor-form-grid">
            <label class="editor-field"><span>Skill ({{ activeLocale }})</span><input v-model="entry.label[activeLocale]" type="text" /></label>
            <label class="editor-field"><span>Iconify icon</span><input v-model="entry.icon" type="text" /></label>
          </div>
          <label class="editor-field"><span>Description ({{ activeLocale }})</span><textarea v-model="entry.description[activeLocale]" rows="2" /></label>
        </details>
        <button class="small-action" type="button" @click="addSkill"><span i-carbon:add /> Add skill</button>
      </div>

      <div v-if="section.key === 'hobbies'" class="editor-entries">
        <details v-for="(group, index) in template.data.hobbies.groups" :key="group.id" class="entry-card section-entry" @toggle="syncSectionEntryState('hobbies')">
          <summary class="entry-summary">
            <span>{{ localized(group.title) || "Hobby group" }}</span>
            <span class="entry-summary-controls" @click.stop>
              <EntryControls :enabled="group.enabled" :index="index" :length="template.data.hobbies.groups.length" @update:enabled="group.enabled = $event" @up="move(template.data.hobbies.groups, index, -1)" @down="move(template.data.hobbies.groups, index, 1)" @remove="removeAt(template.data.hobbies.groups, index)" />
            </span>
          </summary>
          <label class="editor-field"><span>Group ({{ activeLocale }})</span><input v-model="group.title[activeLocale]" type="text" /></label>
          <label v-for="entry in group.entries" :key="entry.id" class="editor-field editor-inline-field"><span>Interest</span><input v-model="entry.label[activeLocale]" type="text" /><input v-model="entry.enabled" type="checkbox" title="Visible" /></label>
          <button class="small-action" type="button" @click="group.entries.push({ id: newId(), enabled: true, label: localizedMap() })"><span i-carbon:add /> Add interest</button>
        </details>
        <button class="small-action" type="button" @click="addHobbyGroup"><span i-carbon:add /> Add hobby group</button>
      </div>
    </details>
  </div>
</template>

<script lang="ts" setup>
import { toRaw } from "vue";
import type { DataRecord, LocalizedText } from "~/utils/templateLibrary";
import {
  deleteData,
  exportDataRecordAsJson,
  saveData
} from "~/utils/templateLibrary";

const props = defineProps<{ template: DataRecord }>();
const emit = defineEmits<{ (event: "saved", template: DataRecord): void }>();
const localePath = useLocalePath();
const template = reactive(structuredClone(toRaw(props.template)) as any);
const activeLocale = ref(Object.keys(template.data.profile.name)[0] || "en");
const newLocale = ref("");
const sectionDetails = ref<Record<string, HTMLDetailsElement>>({});
const sectionEntriesCollapsed = reactive<Record<string, boolean>>({
  profile: true,
  education: true,
  experience: true,
  skills: true,
  hobbies: true
});
const allCollapsed = ref(true);

const locales = computed(() => Object.keys(template.data.profile.name));
const sectionDefinitions = [
  { key: "education", icon: "i-carbon:education", label: "Education" },
  { key: "experience", icon: "i-carbon:person-favorite", label: "Experience" },
  { key: "skills", icon: "i-carbon:skill-level-advanced", label: "Skills" },
  { key: "hobbies", icon: "i-carbon:game-wireless", label: "Hobbies" }
] as const;

const localized = (value: LocalizedText) => value[activeLocale.value] || value.en || Object.values(value)[0] || "";
const newId = () => `entry-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const localizedMap = () => Object.fromEntries(locales.value.map((locale) => [locale, ""]));

const setSectionRef = (key: string, element: unknown) => {
  if (element) sectionDetails.value[key] = element as HTMLDetailsElement;
};

const syncCollapseState = () => {
  const sections = Object.values(sectionDetails.value);
  allCollapsed.value = sections.length > 0 && sections.every((section) => !section.open);
};

const toggleAll = () => {
  const shouldExpand = allCollapsed.value;
  Object.values(sectionDetails.value).forEach((section) => {
    section.open = shouldExpand;
  });
  allCollapsed.value = !shouldExpand;
};

const getSectionEntries = (key: string) =>
  Array.from(sectionDetails.value[key]?.querySelectorAll<HTMLDetailsElement>(".section-entry") || []);

const syncSectionEntryState = (key: string) => {
  const entries = getSectionEntries(key);
  sectionEntriesCollapsed[key] = entries.length > 0 && entries.every((entry) => !entry.open);
};

const toggleSectionEntries = (key: string) => {
  const entries = getSectionEntries(key);
  const shouldExpand = sectionEntriesCollapsed[key];
  entries.forEach((entry) => {
    entry.open = shouldExpand;
  });
  sectionEntriesCollapsed[key] = !shouldExpand;
};

template.data.skills.entries.forEach((entry: any) => {
  entry.description ||= localizedMap();
  entry.icon ||= "";
  if (entry.lineBreak === undefined) entry.lineBreak = true;
});

const isLocalizedMap = (value: unknown): value is LocalizedText =>
  Boolean(value && typeof value === "object" && !Array.isArray(value) && Object.values(value).every((item) => typeof item === "string"));

const addLocale = () => {
  const locale = newLocale.value.trim().toLowerCase();
  if (!locale || locales.value.includes(locale)) return;

  const add = (value: unknown) => {
    if (Array.isArray(value)) value.forEach(add);
    else if (value && typeof value === "object") {
      if (isLocalizedMap(value)) value[locale] = value[activeLocale.value] || "";
      else Object.values(value).forEach(add);
    }
  };

  add(template);
  newLocale.value = "";
  activeLocale.value = locale;
};

const move = (items: any[], index: number, direction: number) => {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) return;
  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
};

const removeAt = (items: any[], index: number) => items.splice(index, 1);

const addProfileInfo = () => template.data.profile.profileInfo.push({ id: newId(), enabled: true, icon: "tabler:info-circle", text: localizedMap(), url: "" });
const addEducation = () => template.data.education.entries.push({ id: newId(), enabled: true, degree: localizedMap(), period: localizedMap(), institutions: [{ name: localizedMap() }] });
const addInstitution = (entry: any) => entry.institutions.push({ name: localizedMap() });
const addExperience = () => template.data.experience.entries.push({ id: newId(), enabled: true, role: localizedMap(), period: localizedMap(), bullets: [] });
const addSkill = () => template.data.skills.entries.push({ id: newId(), enabled: true, label: localizedMap(), description: localizedMap(), lineBreak: true, icon: "" });
const addHobbyGroup = () => template.data.hobbies.groups.push({ id: newId(), enabled: true, title: localizedMap(), entries: [] });

const save = async () => {
  const saved = await saveData(toRaw(template));
  emit("saved", saved);
};

const exportJson = () => {
  exportDataRecordAsJson(toRaw(template));
};

const remove = async () => {
  if (!confirm("Delete this template?")) return;
  await deleteData(template.id);
  await navigateTo(localePath("/data"));
};
</script>

<script lang="ts">
import { defineComponent, h } from "vue";

export default defineComponent({
  components: {
    EntryControls: defineComponent({
      props: {
        enabled: Boolean,
        index: { type: Number, required: true },
        length: { type: Number, required: true }
      },
      emits: ["update:enabled", "up", "down", "remove"],
      setup(props, { emit }) {
        return () =>
          h("div", { class: "entry-controls" }, [
            h("input", {
              type: "checkbox",
              checked: props.enabled,
              onChange: (event: Event) => emit("update:enabled", (event.target as HTMLInputElement).checked),
              title: "Visible"
            }),
            h("button", { type: "button", disabled: props.index === 0, title: "Move up", onClick: () => emit("up") }, [h("span", { class: "i-carbon:chevron-up" })]),
            h("button", { type: "button", disabled: props.index === props.length - 1, title: "Move down", onClick: () => emit("down") }, [h("span", { class: "i-carbon:chevron-down" })]),
            h("button", { type: "button", title: "Remove", onClick: () => emit("remove") }, [h("span", { class: "i-carbon:trash-can" })])
          ]);
      }
    })
  }
});
</script>

<style scoped>
.template-editor-header {
  @apply sticky top-4 z-30 mb-8 flex flex-col gap-5 rounded-xl border border-c bg-c/95 p-4 shadow-sm backdrop-blur-sm md:flex-row md:items-end md:justify-between;
}

.template-editor-heading {
  @apply min-w-0 flex-1;
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
  @apply flex flex-wrap gap-2;
}

.template-editor-meta {
  @apply mt-4 grid gap-3 md:grid-cols-2;
}

.editor-language-bar {
  @apply mt-4 border-t border-c pt-1;
}

.editor-panel {
  @apply mb-5 rounded-xl border border-c bg-c p-5 shadow-sm;
}

.editor-panel-heading {
  @apply mb-5 flex items-center gap-2 text-base font-semibold;
}

.editor-panel-summary,
.entry-summary {
  @apply cursor-pointer list-none;
}

.editor-panel-summary::-webkit-details-marker,
.entry-summary::-webkit-details-marker {
  display: none;
}

.editor-panel-summary::before,
.entry-summary::before {
  content: ">";
  @apply inline-block w-5 text-light-c transition-transform;
}

.section-entry-actions {
  @apply mb-4 flex justify-end;
}

details[open] > .editor-panel-summary::before,
details[open] > .entry-summary::before {
  transform: rotate(90deg);
}

.editor-form-grid {
  @apply grid gap-4 md:grid-cols-2;
}

.editor-form-grid-3 {
  @apply md:grid-cols-3;
}

.editor-field {
  @apply flex min-w-0 flex-col gap-1.5 text-sm;
}

.editor-field > span:first-child,
.locale-label {
  @apply text-xs font-medium text-light-c;
}

.editor-field input[type="text"],
.editor-field input[type="url"],
.editor-field textarea,
.editor-list-row input,
.locale-input {
  @apply min-w-0 rounded-md border border-c bg-transparent px-3 py-2 outline-none focus:border-blue-500;
}

.editor-wide-field {
  @apply mb-4;
}

.field-inline,
.section-title-toggle,
.editor-photo-toggle {
  @apply flex items-center gap-2 text-xs text-light-c;
}

.locale-row {
  @apply mt-3 flex flex-wrap items-center gap-2;
}

.locale-button,
.icon-action,
.small-action {
  @apply inline-flex items-center gap-1 rounded-md border border-c px-2.5 py-1.5 text-xs hover:bg-darker-c;
}

.locale-button-active {
  @apply border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300;
}

.locale-input {
  @apply w-20 py-1.5 text-xs;
}

.editor-subsection {
  @apply mt-6 border-t border-c pt-5;
}

.editor-subheading {
  @apply mb-3 text-sm font-semibold;
}

.editor-list-row {
  @apply mb-2 grid items-center gap-2 md:grid-cols-[1fr_1fr_1fr_auto_auto];
}

.editor-entries {
  @apply grid gap-4;
}

.entry-card {
  @apply relative rounded-lg border border-c p-4;
}

.entry-summary {
  @apply mb-4 flex items-center justify-between gap-3 font-medium;
}

.entry-summary-controls {
  @apply flex-none;
}

.entry-summary-controls .entry-controls {
  @apply mb-0;
}

.compact-entry-card {
  @apply pb-4;
}

.entry-controls {
  @apply mb-4 flex items-center gap-1;
}

.entry-controls button {
  @apply rounded p-1 text-light-c hover:bg-darker-c disabled:opacity-30;
}

.editor-inline-field {
  @apply mt-3 md:flex-row md:items-center;
}

.editor-inline-field > span {
  @apply w-20 flex-none;
}

.editor-inline-field input[type="text"] {
  @apply flex-1;
}

.small-action {
  @apply w-fit text-blue-700 dark:text-blue-300;
}
</style>
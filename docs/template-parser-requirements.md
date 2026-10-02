# Template Parser Requirements

## Goal

Add a browser-based template parser that takes structured resume data and a Markdown template, then generates Markdown that can be loaded into the existing editor and exported through the current browser PDF workflow.

The parser is not responsible for PDF generation. PDF export remains the existing `window.print()` flow.

## Confirmed Decisions

- The first implementation is a minimal vertical slice.
- Resume data is edited through structured browser forms.
- Data is persisted in the browser using local storage or IndexedDB.
- Data must also support JSON import and export for backup and portability.
- Templates are bundled project files initially.
- Users can toggle complete sections and individual entries.
- Generated Markdown is loaded into the existing Markdown editor.
- The data model supports arbitrary locale keys.
- Locale selection falls back to English when the requested translation is missing.
- The initial fields will be derived from the example resume rather than designed in advance.
- The example resume is `template-parser/resume.md`.
- The original example remains unchanged; the parameterized template is `site/src/assets/default-resume-template.md`.
- Templates use Mustache-like syntax.
- The first parser needs scalar variables, conditionals, list iteration, and reusable partials.
- Header fields include name, address/location, phone, birth date, email, photo, and social links.
- Every header item has an independent visibility toggle.
- Education has section-level and entry-level visibility toggles.
- Experience entries are independently toggleable as complete entries.
- Skills are represented as individually toggleable named entries.
- Hobbies contain toggleable groups and entries.
- Entries can be reordered with drag and drop.
- Missing translations fall back to English and produce a warning.
- The skills/hobbies area supports a two-column or stacked layout setting.
- Iconify icon names are stored in the data model and rendered by the template.
- Section headings are stored in resume data and can be translated.

## Existing Integration Points

### Markdown editor and PDF export

The generated Markdown should enter the existing editor state, likely through the data store used by the edit page. The existing PDF action then renders the editor preview and calls `window.print()`.

Relevant files:

- `site/src/composables/stores/data.ts`
- `site/src/composables/resumeExport.ts`
- `site/src/components/edit/toolbar/File.vue`

### Markdown rendering

The generated output must remain compatible with the current Markdown renderer, including front matter, definition lists, KaTeX, cross references, LaTeX commands, and external link attributes.

Relevant file:

- `site/src/utils/markdown.ts`

### Example resume

The source example is:

- `template-parser/resume.md`

The first parameterized template is:

- `site/src/assets/default-resume-template.md`

## Proposed User Flow

1. Open a new Template Parser view in the browser.
2. Load the persisted structured resume data.
3. Select a locale.
4. Select a bundled Markdown template.
5. Enable or disable sections.
6. Enable or disable individual entries within repeatable sections.
7. Generate Markdown.
8. Load the generated Markdown into the existing editor.
9. Review or edit the result.
10. Export to PDF using the existing browser print action.

## Data Model Direction

The data should distinguish between:

- Scalar profile data, such as name, email, location, and summary.
- Repeatable entries, such as experience, education, projects, and certifications.
- Locale-aware fields, where a value can be stored under keys such as `en`, `de`, or another locale.
- Stable entry IDs, so selections remain valid when entries are reordered.
- Ordering, so the browser can preserve the intended resume order.
- Enabled state, either on sections, individual entries, or both.

The exact sections and fields must be extracted from the example resume. Avoid making the schema generic until the real content has been inspected.

## Template Syntax

The initial template syntax is Mustache-like:

- `{{profile.name}}` resolves a scalar value.
- `{{#if sections.education.enabled}}...{{/if}}` renders an optional block.
- `{{#each education.entries}}...{{/each}}` iterates over entries.
- `{{this}}` resolves the current scalar list item.
- `{{> skills}}` inserts a reusable partial.
- `{{else}}` selects the alternate branch of a conditional.

The parser must define escaping, missing values, empty lists, partial lookup, locale resolution, and invalid-expression errors before implementation is complete.

## Persistence Requirements

The first version should provide:

- Automatic persistence in the browser.
- JSON export of the complete structured resume data.
- JSON import with validation.
- Clear handling of malformed or incompatible JSON.
- Stable IDs for entries after import.
- Preservation of locale-specific values and enabled selections.

The initial version does not need server storage or user accounts.

## Validation Requirements

Before generating Markdown, validate at least:

- A template is selected.
- A locale is selected.
- Required identity fields are present, once those fields are defined.
- Imported JSON has the expected top-level shape.
- Repeatable entries have stable IDs and valid content.
- The selected template does not contain unsupported syntax.

Errors should be shown in the browser and should not replace the current editor content.

## Implementation Sequence

### Step 1: Inspect the example resume

- Confirm which Markdown file is the source example.
- List its sections, fields, front matter, formatting patterns, and repeated structures.
- Identify which content should become editable data and which content should remain template-owned.

### Step 2: Define the first schema

- Add TypeScript types for the structured resume data.
- Define the locale-aware value shape.
- Define repeatable entry IDs and ordering.
- Define section and entry selection state.
- Define the JSON import/export format.

### Step 3: Define and document template syntax

- Choose the minimum required expression set.
- Add one bundled template based on the example resume.
- Define escaping, missing values, empty lists, and errors.
- Add parser tests using representative resume data.

### Step 4: Implement the parser

- Parse the template into output Markdown.
- Resolve locale values with the requested-locale-then-English fallback.
- Apply section and entry selection.
- Return structured errors without mutating editor state.

### Step 5: Add browser persistence

- Persist structured data locally.
- Implement JSON import and export.
- Validate imported data before replacing the current data.

### Step 6: Add the browser workflow

- Add the Template Parser view or panel.
- Add locale and template selectors.
- Add section and entry toggles.
- Add generate and load actions.
- Preserve the existing editor and PDF export behavior.

### Step 7: Test the end-to-end flow

- Generate Markdown from the default data.
- Verify locale fallback.
- Verify disabled sections and entries are absent.
- Verify imported data survives a reload.
- Verify generated Markdown loads into the editor.
- Verify the existing browser PDF export still works.

## Non-Goals For The First Version

- Server-side PDF generation.
- Replacing the current Markdown editor.
- User accounts or cloud synchronization.
- A general-purpose programming language for templates.
- Arbitrary runtime template uploads, unless import/export is later requested.
- Automatically inferring a perfect schema from every possible resume format.

## Open Decisions Before Implementation

1. Decide whether bundled templates should later support import/export.
2. Decide whether the first persistence backend should be `localStorage` or IndexedDB.
3. Decide the initial locale list and default locale.
4. Define the exact JSON schema from the template fields.
5. Define parser behavior for escaping, missing values, empty lists, invalid expressions, and missing partials.
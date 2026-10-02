---
---

<!-- HEADER -->

<div style="display: grid; grid-template-columns: 5fr 2fr; gap: 0px;">

<!-- ICONS & INFO -->
<div>

# {{profile.name}}

{{#each profile.profileInfo}}
{{#if enabled}}{{#if @even}}: {{/if}}<iconify-icon icon="{{icon}}"></iconify-icon > {{#if url}}[{{text}}]({{url}}){{else}}{{text}}{{/if}}{{#if @even}}
{{/if}}{{/if}}
{{/each}}

</div>

<!-- PICTURE -->

{{#if profile.photo.enabled}}
<img src="{{profile.photo.src}}" style="width:70%; place-self: center end; border-radius: 100%"/>
{{/if}}

</div>

{{#if education.enabled}}

## {{education.title}}

{{#each education.entries}}
{{#if enabled}}
**{{degree}}**
: **{{period}}**

{{#each institutions}}
&emsp; {{name}}<br>
{{/each}}
<br>

{{/if}}
{{/each}}
{{/if}}

{{#if experience.enabled}}

## {{experience.title}}

{{#each experience.entries}}
{{#if enabled}}
**{{role}}**
: **{{period}}**
{{#each bullets}}

- {{text}}
  {{/each}}

{{/if}}
{{/each}}
{{/if}}

{{#if hobbies.enabled}}
{{#if skills.enabled}}
{{#if layout.skillsAndHobbiesTwoColumn}}
<div style="display: grid; grid-template-columns: 55fr 45fr; gap: 20px;">
{{else}}
<div>
{{/if}}
{{else}}
<div>
{{/if}}
{{else}}
<div>
{{/if}}

<div>
{{#if skills.enabled}}

## {{skills.title}}

{{#each skills.entries}}
{{#if enabled}}
{{#if icon}}<iconify-icon icon="{{icon}}"></iconify-icon > {{/if}}**{{label}}** <br>
{{#if description}}{{description}}<br>{{/if}}
{{/if}}
{{/each}}
<br>
{{/if}}
</div>

<div>
{{#if hobbies.enabled}}

## {{hobbies.title}}

{{#each hobbies.groups}}
{{#if enabled}}
**{{title}}**
{{#each entries}}
{{#if enabled}}

- {{label}}
{{/if}}
{{/each}}

{{/if}}
{{/each}}
{{/if}}
</div>

</div>

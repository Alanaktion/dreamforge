<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<section class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
	<div class="space-y-5">
		<span class="forge-badge">Step 1 of 2</span>
		<h2 class="text-4xl font-semibold tracking-tight text-surface-950 dark:text-surface-50">Create the universe that will own your first character roster.</h2>
		<p class="max-w-2xl text-base leading-7 text-surface-700 dark:text-surface-300">
			Trait definitions live at the universe level. Start with a few stable keys and you can expand later without losing structure.
		</p>

		<div class="space-y-4">
			<article class="forge-stat">
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-100">Trait definition format</h3>
				<p class="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-300">Provide a JSON array of objects with `key`, `label`, and an optional `valueType`, `description`, `options`, or `isRequired` flag.</p>
			</article>
			<article class="forge-stat">
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-100">Suggested baseline</h3>
				<p class="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-300">Role, origin, and alignment are included as a starter. Replace them if your setting needs lineage charts, factions, magic systems, or political office instead.</p>
			</article>
		</div>
	</div>

	<form class="forge-panel space-y-5 p-8" method="POST">
		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Universe name</span>
			<input class="forge-input" name="name" value={form?.values?.name ?? ''} placeholder="The Glass Archive" required />
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Summary</span>
			<textarea class="forge-textarea" name="summary" placeholder="A one-paragraph orientation for this setting.">{form?.values?.summary ?? ''}</textarea>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Trait definitions JSON</span>
			<textarea class="forge-textarea font-mono text-sm" name="traitDefinitions" spellcheck="false">{form?.values?.traitDefinitions ?? data.starterTraitDefinitions}</textarea>
		</label>

		{#if form?.message}
			<p class="rounded-2xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-900">{form.message}</p>
		{/if}

		<button class="forge-button w-full" type="submit">Create universe and continue</button>
	</form>
</section>

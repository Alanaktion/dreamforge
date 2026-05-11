<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { SvelteMap } from 'svelte/reactivity';

	let { data, form }: PageProps = $props();

	type TraitValue = (typeof data.traitValues)[number];

	function groupByCategory(traits: TraitValue[]): [string, TraitValue[]][] {
		const map = new SvelteMap<string, TraitValue[]>();
		for (const trait of traits) {
			const cat = trait.category || '';
			if (!map.has(cat)) map.set(cat, []);
			map.get(cat)!.push(trait);
		}
		return [...map.entries()];
	}

	let traitsByCategory = $derived(groupByCategory(data.traitValues));

	function initialValue(trait: TraitValue): string {
		if (form?.values?.traits) {
			return form.values.traits[trait.key] ?? '';
		}
		return trait.value ?? '';
	}
</script>

<section class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
	<form class="forge-panel space-y-5 p-8" method="POST">
		<div>
			<a class="forge-link text-sm" href={resolve(`/characters/${data.character.id}`)}>
				← Back to character</a
			>
			<h2 class="mt-3 text-3xl font-semibold text-surface-950 dark:text-surface-50">
				Edit character profile
			</h2>
		</div>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
				>Character name</span
			>
			<input
				class="forge-input"
				name="name"
				value={form?.values?.name ?? data.character.name}
				placeholder="Captain Ilyra Voss"
				required
			/>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Summary</span>
			<textarea
				class="forge-textarea"
				name="summary"
				placeholder="A concise card view summary."
				>{form?.values?.summary ?? data.character.summary}</textarea
			>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200"> Bio </span>
			<textarea
				class="forge-textarea text-sm"
				name="bioMarkdown"
				placeholder="Write the long-form biography here."
				>{form?.values?.bioMarkdown ?? data.character.bioMarkdown}</textarea
			>
		</label>

		{#if data.traitValues.length > 0}
			<div class="space-y-4">
				<span class="forge-badge">Traits</span>

				{#each traitsByCategory as [category, traits] (category)}
					<div class="space-y-3">
						{#if category}
							<h3
								class="text-xs font-semibold tracking-[0.18em] text-surface-500 uppercase"
							>
								{category}
							</h3>
						{/if}
						{#each traits as trait (trait.id)}
							<label class="block space-y-1">
								<span
									class="text-sm font-medium text-surface-800 dark:text-surface-200"
									>{trait.label}</span
								>
								{#if trait.description}
									<p class="text-xs text-surface-500">{trait.description}</p>
								{/if}
								{#if trait.valueType === 'boolean'}
									<select class="forge-select" name="trait:{trait.key}">
										<option value="">— unset —</option>
										<option
											value="true"
											selected={initialValue(trait) === 'true'}>Yes</option
										>
										<option
											value="false"
											selected={initialValue(trait) === 'false'}>No</option
										>
									</select>
								{:else if trait.valueType === 'number'}
									<input
										class="forge-input"
										type="number"
										name="trait:{trait.key}"
										value={initialValue(trait)}
									/>
								{:else if trait.valueType === 'date'}
									<input
										class="forge-input"
										type="date"
										name="trait:{trait.key}"
										value={initialValue(trait)}
									/>
								{:else if trait.valueType === 'paragraph'}
									<textarea class="forge-textarea" name="trait:{trait.key}"
										>{initialValue(trait)}</textarea
									>
								{:else}
									<input
										class="forge-input"
										type="text"
										name="trait:{trait.key}"
										value={initialValue(trait)}
									/>
								{/if}
							</label>
						{/each}
					</div>
				{/each}
			</div>
		{/if}

		{#if form?.message}
			<p
				class="rounded-2xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-900"
			>
				{form.message}
			</p>
		{/if}

		<button class="forge-button w-full" type="submit">Save changes</button>
	</form>

	<aside class="space-y-5">
		<div class="forge-panel p-6">
			<p class="text-sm font-semibold tracking-[0.2em] text-primary-700 uppercase">
				Universe
			</p>
			<h3 class="mt-3 text-2xl font-semibold text-surface-950 dark:text-surface-50">
				{data.character.universeName}
			</h3>
			<p class="mt-3 text-sm leading-7 text-surface-700 dark:text-surface-300">
				{data.character.universeSummary || 'No universe summary provided yet.'}
			</p>
			<p class="mt-4 text-sm text-surface-500">
				{data.traitDefinitions.length} trait{data.traitDefinitions.length === 1 ? '' : 's'} defined
			</p>
		</div>
	</aside>
</section>

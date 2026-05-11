<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let selectedUniverseId = $state(
		untrack(() => form?.values?.universeId ?? data.selectedUniverseId)
	);

	let selectedUniverse = $derived(
		data.universes.find((u) => u.id === selectedUniverseId) ?? data.universes[0]
	);

	type TraitDef = (typeof data.universes)[number]['traitDefinitions'][number];

	function groupByCategory(defs: TraitDef[]): [string, TraitDef[]][] {
		const map = new Map<string, TraitDef[]>();
		for (const def of defs) {
			const cat = def.category || '';
			if (!map.has(cat)) map.set(cat, []);
			map.get(cat)!.push(def);
		}
		return [...map.entries()];
	}

	let traitsByCategory = $derived(groupByCategory(selectedUniverse.traitDefinitions));

	function restoredValue(key: string): string {
		if (form?.values?.universeId === selectedUniverseId) {
			return form.values.traits?.[key] ?? '';
		}
		return '';
	}
</script>

<section class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
	<form class="forge-panel space-y-5 p-8" method="POST">
		<div>
			<h2 class="mt-3 text-3xl font-semibold text-surface-950 dark:text-surface-50">
				Create a character profile
			</h2>
		</div>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Universe</span>
			<select class="forge-select" name="universeId" bind:value={selectedUniverseId}>
				{#each data.universes as universeOption (universeOption.id)}
					<option value={universeOption.id}>{universeOption.name}</option>
				{/each}
			</select>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
				>Character name</span
			>
			<input
				class="forge-input"
				name="name"
				value={form?.values?.name ?? ''}
				placeholder="Captain Ilyra Voss"
				required
			/>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Summary</span>
			<textarea
				class="forge-textarea"
				name="summary"
				placeholder="A concise card view summary.">{form?.values?.summary ?? ''}</textarea
			>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
				>Bio markdown</span
			>
			<textarea
				class="forge-textarea font-mono text-sm"
				name="bioMarkdown"
				placeholder="# Early life&#10;&#10;Write the long-form biography here."
				>{form?.values?.bioMarkdown ?? ''}</textarea
			>
		</label>

		{#if selectedUniverse.traitDefinitions.length > 0}
			<div class="space-y-4">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
					>Traits</span
				>

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
											selected={restoredValue(trait.key) === 'true'}
											>Yes</option
										>
										<option
											value="false"
											selected={restoredValue(trait.key) === 'false'}
											>No</option
										>
									</select>
								{:else if trait.valueType === 'number'}
									<input
										class="forge-input"
										type="number"
										name="trait:{trait.key}"
										value={restoredValue(trait.key)}
									/>
								{:else if trait.valueType === 'date'}
									<input
										class="forge-input"
										type="date"
										name="trait:{trait.key}"
										value={restoredValue(trait.key)}
									/>
								{:else if trait.valueType === 'paragraph'}
									<textarea
										class="forge-textarea"
										name="trait:{trait.key}"
									>{restoredValue(trait.key)}</textarea>
								{:else}
									<input
										class="forge-input"
										type="text"
										name="trait:{trait.key}"
										value={restoredValue(trait.key)}
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

		<button class="forge-button w-full" type="submit">Create character</button>
	</form>

	<aside class="space-y-5">
		<div class="forge-panel p-6">
			<p class="text-sm font-semibold tracking-[0.2em] text-primary-700 uppercase">
				Selected universe
			</p>
			<h3 class="mt-3 text-2xl font-semibold text-surface-950 dark:text-surface-50">
				{selectedUniverse.name}
			</h3>
			<p class="mt-3 text-sm leading-7 text-surface-700 dark:text-surface-300">
				{selectedUniverse.summary || 'No universe summary provided yet.'}
			</p>
			<p class="mt-4 text-sm text-surface-500">
				{selectedUniverse.traitDefinitions.length} trait{selectedUniverse.traitDefinitions
					.length === 1
					? ''
					: 's'} defined
			</p>
		</div>
	</aside>
</section>

<script lang="ts">
	import { untrack } from 'svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data, form }: PageProps = $props();

	// ── Info form ──────────────────────────────────────────────────────────────

	let infoName = $state(
		untrack(() => {
			const v = form?.action === 'updateInfo' && form.values;
			return v && 'name' in v ? v.name : data.universe.name;
		})
	);
	let infoSummary = $state(
		untrack(() => {
			const v = form?.action === 'updateInfo' && form.values;
			return v && 'summary' in v ? v.summary : data.universe.summary;
		})
	);

	// ── Trait editor ───────────────────────────────────────────────────────────

	type TraitEntry = {
		key: string;
		label: string;
		category: string;
		description: string;
		valueType: 'text' | 'paragraph' | 'number' | 'boolean' | 'date';
		isExisting: boolean;
		markedForRemoval: boolean;
	};

	function buildInitialTraits(): TraitEntry[] {
		const v = form?.action === 'updateTraits' && form.values;
		if (v && 'traitDefinitions' in v && v.traitDefinitions) {
			try {
				const parsed = JSON.parse(v.traitDefinitions) as {
					key: string;
					label: string;
					category: string;
					description: string;
					valueType: 'text' | 'paragraph' | 'number' | 'boolean' | 'date';
				}[];
				const existingKeys = new Set(data.traitDefinitions.map((d) => d.key));
				return parsed.map((t) => ({
					...t,
					isExisting: existingKeys.has(t.key),
					markedForRemoval: false
				}));
			} catch {
				// fall through to data
			}
		}

		return data.traitDefinitions.map((d) => ({
			key: d.key,
			label: d.label,
			category: d.category,
			description: d.description,
			valueType: d.valueType as 'text' | 'number' | 'boolean' | 'date',
			isExisting: true,
			markedForRemoval: false
		}));
	}

	let traits = $state<TraitEntry[]>(buildInitialTraits());

	function addTrait() {
		traits.push({
			key: '',
			label: '',
			category: '',
			description: '',
			valueType: 'text',
			isExisting: false,
			markedForRemoval: false
		});
	}

	function toggleRemoval(index: number) {
		traits[index].markedForRemoval = !traits[index].markedForRemoval;
	}

	function removeTrait(index: number) {
		traits.splice(index, 1);
	}

	function generateKey(label: string): string {
		return label
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '_')
			.replace(/[^a-z0-9_]/g, '');
	}

	function handleLabelBlur(trait: TraitEntry) {
		if (!trait.isExisting && !trait.key && trait.label) {
			trait.key = generateKey(trait.label);
		}
	}

	let activeTraits = $derived(traits.filter((t) => !t.markedForRemoval));
	let traitDefinitionsJson = $derived(
		JSON.stringify(
			activeTraits.map(({ key, label, category, description, valueType }) => ({
				key,
				label,
				category,
				description,
				valueType
			}))
		)
	);

	let removedCount = $derived(traits.filter((t) => t.markedForRemoval && t.isExisting).length);

	let categoryOptions = $derived(
		[...new Set(traits.map((t) => t.category).filter(Boolean))].sort()
	);
</script>

<section class="space-y-8">
	<div class="flex items-center gap-4">
		<a class="forge-link text-sm" href={resolve('/universes')}>← All universes</a>
	</div>

	<div class="grid gap-8 lg:grid-cols-2">
		<!-- Universe info -->
		<div class="space-y-4">
			<div>
				<span class="forge-badge">Universe settings</span>
				<h2 class="mt-3 text-2xl font-semibold text-surface-950 dark:text-surface-50">
					Basic information
				</h2>
			</div>

			<form class="forge-panel space-y-5 p-6" method="POST" action="?/updateInfo">
				<label class="block space-y-2">
					<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
						>Universe name</span
					>
					<input class="forge-input" name="name" bind:value={infoName} required />
				</label>

				<label class="block space-y-2">
					<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
						>Summary</span
					>
					<textarea class="forge-textarea" name="summary" bind:value={infoSummary}
					></textarea>
				</label>

				{#if form?.action === 'updateInfo'}
					{#if form.success}
						<p
							class="rounded-2xl border border-success-300 bg-success-50 px-4 py-3 text-sm text-success-900"
						>
							Universe info saved.
						</p>
					{:else if form.message}
						<p
							class="rounded-2xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-900"
						>
							{form.message}
						</p>
					{/if}
				{/if}

				<button class="forge-button w-full" type="submit">Save info</button>
			</form>
		</div>

		<!-- Stat summary -->
		<div class="space-y-4">
			<div>
				<span class="forge-badge">Overview</span>
				<h2 class="mt-3 text-2xl font-semibold text-surface-950 dark:text-surface-50">
					Universe stats
				</h2>
			</div>
			<div class="forge-panel space-y-4 p-6">
				<div
					class="flex items-center justify-between gap-4 border-b border-surface-200 pb-4 dark:border-surface-800"
				>
					<span class="text-sm text-surface-700 dark:text-surface-300">Created</span>
					<span class="text-sm font-medium text-surface-900 dark:text-surface-100"
						>{data.universe.createdAt.toLocaleDateString()}</span
					>
				</div>
				<div
					class="flex items-center justify-between gap-4 border-b border-surface-200 pb-4 dark:border-surface-800"
				>
					<span class="text-sm text-surface-700 dark:text-surface-300">Last updated</span>
					<span class="text-sm font-medium text-surface-900 dark:text-surface-100"
						>{data.universe.updatedAt.toLocaleDateString()}</span
					>
				</div>
				<div
					class="flex items-center justify-between gap-4 border-b border-surface-200 pb-4 dark:border-surface-800"
				>
					<span class="text-sm text-surface-700 dark:text-surface-300"
						>Trait definitions</span
					>
					<span class="text-sm font-medium text-surface-900 dark:text-surface-100"
						>{data.traitDefinitions.length}</span
					>
				</div>
				<div class="flex items-center justify-between gap-4">
					<span class="text-sm text-surface-700 dark:text-surface-300">Characters</span>
					<div class="flex items-center gap-4">
						<a
							class="forge-link text-sm font-medium"
							href={resolve(`/universes/${data.universe.id}/import`)}>Import CSV</a
						>
						<a
							class="forge-link text-sm font-medium"
							href={resolve(`/characters?universe=${data.universe.id}`)}
							>View characters</a
						>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Trait editor -->
	<div>
		<div class="flex items-end justify-between gap-4">
			<div>
				<span class="forge-badge">Trait schema</span>
				<h2 class="mt-3 text-2xl font-semibold text-surface-950 dark:text-surface-50">
					Trait definitions
				</h2>
				<p class="mt-2 max-w-2xl text-sm leading-6 text-surface-700 dark:text-surface-300">
					Traits apply to every character in this universe. Existing trait keys cannot be
					changed. Removing a trait permanently deletes stored values from all characters.
				</p>
			</div>
			<button class="forge-button-ghost shrink-0" type="button" onclick={addTrait}
				>+ Add trait</button
			>
		</div>

		<form class="mt-6 space-y-4" method="POST" action="?/updateTraits">
			<input type="hidden" name="traitDefinitions" value={traitDefinitionsJson} />
			<datalist id="trait-categories">
				{#each categoryOptions as cat (cat)}
					<option value={cat}></option>
				{/each}
			</datalist>

			{#if traits.length === 0}
				<div class="forge-panel p-8 text-center">
					<p class="text-surface-700 dark:text-surface-300">
						No traits defined. Add one above.
					</p>
				</div>
			{:else}
				{#each traits as trait, i (i)}
					<div
						class={[
							'rounded-2xl border p-4 transition-colors',
							trait.markedForRemoval
								? 'border-error-300 bg-error-50/50 dark:border-error-800 dark:bg-error-950/30'
								: 'border-surface-200 bg-white/60 dark:border-surface-800 dark:bg-surface-900/60'
						].join(' ')}
					>
						<div class="mb-3 flex items-center justify-between gap-4">
							<div class="flex items-center gap-3">
								<span
									class="text-xs font-semibold tracking-[0.15em] text-surface-500 uppercase"
								>
									{trait.isExisting ? 'Existing trait' : 'New trait'}
								</span>
								{#if trait.markedForRemoval}
									<span
										class="text-xs font-semibold text-error-600 dark:text-error-400"
										>Will be removed</span
									>
								{/if}
							</div>
							{#if trait.isExisting}
								<button
									class={trait.markedForRemoval
										? 'text-xs font-medium text-surface-600 hover:text-surface-800 dark:text-surface-400'
										: 'text-xs font-medium text-error-600 hover:text-error-700 dark:text-error-400'}
									type="button"
									onclick={() => toggleRemoval(i)}
								>
									{trait.markedForRemoval ? 'Undo remove' : 'Remove'}
								</button>
							{:else}
								<button
									class="text-xs font-medium text-surface-500 hover:text-surface-700"
									type="button"
									onclick={() => removeTrait(i)}
								>
									Discard
								</button>
							{/if}
						</div>

						{#if !trait.markedForRemoval}
							<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
								<label class="block space-y-1">
									<span
										class="text-xs font-medium text-surface-700 dark:text-surface-300"
										>Label <span class="text-error-500">*</span></span
									>
									<input
										class="forge-input text-sm"
										placeholder="Appearance"
										bind:value={trait.label}
										onblur={() => handleLabelBlur(trait)}
										required
									/>
								</label>
								<label class="block space-y-1">
									<span
										class="text-xs font-medium text-surface-700 dark:text-surface-300"
										>Key</span
									>
									{#if trait.isExisting}
										<div
											class="forge-input flex items-center bg-surface-100 font-mono text-sm text-surface-600 dark:bg-surface-800 dark:text-surface-400"
										>
											{trait.key}
										</div>
									{:else}
										<input
											class="forge-input font-mono text-sm"
											placeholder="appearance"
											bind:value={trait.key}
											required
										/>
									{/if}
								</label>
								<label class="block space-y-1">
									<span
										class="text-xs font-medium text-surface-700 dark:text-surface-300"
										>Category</span
									>
									<input
										class="forge-input text-sm"
										placeholder="e.g. personality, history…"
										list="trait-categories"
										bind:value={trait.category}
									/>
								</label>
								<label class="block space-y-1">
									<span
										class="text-xs font-medium text-surface-700 dark:text-surface-300"
										>Value type</span
									>
									<select
										class="forge-select text-sm"
										bind:value={trait.valueType}
										disabled={trait.isExisting}
									>
										<option value="text">Text</option>
										<option value="paragraph">Paragraph</option>
										<option value="number">Number</option>
										<option value="boolean">Boolean</option>
										<option value="date">Date</option>
									</select>
								</label>
								<label class="block space-y-1 sm:col-span-2 lg:col-span-4">
									<span
										class="text-xs font-medium text-surface-700 dark:text-surface-300"
										>Description</span
									>
									<input
										class="forge-input text-sm"
										placeholder="Optional hint shown when filling in character profiles."
										bind:value={trait.description}
									/>
								</label>
							</div>
						{:else}
							<p class="text-sm text-surface-600 dark:text-surface-400">
								<span class="font-mono">{trait.key}</span> — {trait.label}{trait.category
									? ` (${trait.category})`
									: ''}
							</p>
						{/if}
					</div>
				{/each}
			{/if}

			{#if removedCount > 0}
				<p
					class="rounded-2xl border border-warning-300 bg-warning-50 px-4 py-3 text-sm text-warning-900 dark:border-warning-800 dark:bg-warning-950/40 dark:text-warning-200"
				>
					⚠ Saving will permanently delete {removedCount} trait{removedCount === 1
						? ''
						: 's'} and all stored values from characters in this universe.
				</p>
			{/if}

			{#if form?.action === 'updateTraits'}
				{#if form.success}
					<p
						class="rounded-2xl border border-success-300 bg-success-50 px-4 py-3 text-sm text-success-900"
					>
						Trait schema saved.
					</p>
				{:else if form.message}
					<p
						class="rounded-2xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-900"
					>
						{form.message}
					</p>
				{/if}
			{/if}

			<div class="flex gap-3">
				<button class="forge-button-ghost" type="button" onclick={addTrait}
					>+ Add trait</button
				>
				<button class="forge-button flex-1" type="submit">Save trait schema</button>
			</div>
		</form>
	</div>
</section>

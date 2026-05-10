<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type TraitDef = {
		key: string;
		label: string;
		category: string;
		description: string;
		valueType: 'text' | 'number' | 'boolean';
	};

	function parseInitialTraits(): TraitDef[] {
		try {
			const raw = form?.values?.traitDefinitions ?? data.starterTraitDefinitions;
			return JSON.parse(raw);
		} catch {
			return [];
		}
	}

	let traits = $state<TraitDef[]>(parseInitialTraits());

	function addTrait() {
		traits.push({ key: '', label: '', category: '', description: '', valueType: 'text' });
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

	function handleLabelBlur(trait: TraitDef) {
		if (!trait.key && trait.label) {
			trait.key = generateKey(trait.label);
		}
	}

	let traitDefinitionsJson = $derived(JSON.stringify(traits));
</script>

<section class="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
	<div class="space-y-5">
		<span class="forge-badge">Step 1 of 2</span>
		<h2 class="text-4xl font-semibold tracking-tight text-surface-950 dark:text-surface-50">
			Create the universe that will own your first character roster.
		</h2>
		<p class="max-w-2xl text-base leading-7 text-surface-700 dark:text-surface-300">
			Trait definitions live at the universe level. Add as many as you need — none are
			required to fill in on individual characters.
		</p>

		<div class="space-y-4">
			<article class="forge-stat">
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-100">
					Categories
				</h3>
				<p class="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-300">
					Group related traits with an optional category name (e.g. personality,
					appearance, history). Leave blank to show traits ungrouped.
				</p>
			</article>
			<article class="forge-stat">
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-100">
					Trait key
				</h3>
				<p class="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-300">
					The key is a stable identifier used internally. It is auto-generated from the
					label but can be edited. It cannot be changed after characters are created.
				</p>
			</article>
		</div>
	</div>

	<form class="forge-panel space-y-5 p-8" method="POST">
		<input type="hidden" name="traitDefinitions" value={traitDefinitionsJson} />

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
				>Universe name</span
			>
			<input
				class="forge-input"
				name="name"
				value={form?.values?.name ?? ''}
				placeholder="The Glass Archive"
				required
			/>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Summary</span>
			<textarea
				class="forge-textarea"
				name="summary"
				placeholder="A one-paragraph orientation for this setting."
				>{form?.values?.summary ?? ''}</textarea
			>
		</label>

		<div class="space-y-3">
			<div class="flex items-center justify-between gap-4">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
					>Trait definitions</span
				>
				<button class="forge-button-ghost text-sm" type="button" onclick={addTrait}
					>+ Add trait</button
				>
			</div>

			{#if traits.length === 0}
				<p
					class="rounded-2xl border border-dashed border-surface-300 px-4 py-6 text-center text-sm text-surface-500 dark:border-surface-700 dark:text-surface-400"
				>
					No traits defined yet. Add one above.
				</p>
			{:else}
				<div class="space-y-3">
					{#each traits as trait, i (i)}
						<div
							class="rounded-2xl border border-surface-200 bg-white/60 p-4 dark:border-surface-800 dark:bg-surface-900/60"
						>
							<div class="mb-3 flex items-center justify-between gap-4">
								<span
									class="text-xs font-semibold tracking-[0.15em] text-surface-500 uppercase"
									>Trait {i + 1}</span
								>
								<button
									class="text-xs text-error-600 hover:text-error-700 dark:text-error-400"
									type="button"
									onclick={() => removeTrait(i)}>Remove</button
								>
							</div>
							<div class="grid gap-3 sm:grid-cols-2">
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
										>Key <span class="text-error-500">*</span></span
									>
									<input
										class="forge-input font-mono text-sm"
										placeholder="appearance"
										bind:value={trait.key}
										required
									/>
								</label>
								<label class="block space-y-1">
									<span
										class="text-xs font-medium text-surface-700 dark:text-surface-300"
										>Category</span
									>
									<input
										class="forge-input text-sm"
										placeholder="e.g. personality, history…"
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
									>
										<option value="text">Text</option>
										<option value="number">Number</option>
										<option value="boolean">Boolean</option>
									</select>
								</label>
								<label class="block space-y-1 sm:col-span-2">
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
						</div>
					{/each}
				</div>
			{/if}
		</div>

		{#if form?.message}
			<p
				class="rounded-2xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-900"
			>
				{form.message}
			</p>
		{/if}

		<button class="forge-button w-full" type="submit">Create universe and continue</button>
	</form>
</section>

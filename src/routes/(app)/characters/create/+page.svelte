<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	function selectedUniverseId() {
		return form?.values?.universeId ?? data.selectedUniverseId;
	}

	function selectedUniverse() {
		return data.universes.find((universe) => universe.id === selectedUniverseId()) ?? data.universes[0];
	}

	function traitValues() {
		return form?.values?.traitValues ?? data.traitTemplate;
	}
</script>

<section class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
	<form class="forge-panel space-y-5 p-8" method="POST">
		<div>
			<span class="forge-badge">POST /characters/create</span>
			<h2 class="mt-3 text-3xl font-semibold text-surface-950">Create a character profile</h2>
		</div>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800">Universe</span>
			<select class="forge-select" name="universeId">
				{#each data.universes as universeOption (universeOption.id)}
					<option selected={universeOption.id === selectedUniverseId()} value={universeOption.id}>{universeOption.name}</option>
				{/each}
			</select>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800">Character name</span>
			<input class="forge-input" name="name" value={form?.values?.name ?? ''} placeholder="Captain Ilyra Voss" required />
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800">Summary</span>
			<textarea class="forge-textarea" name="summary" placeholder="A concise card view summary.">{form?.values?.summary ?? ''}</textarea>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800">Bio markdown</span>
			<textarea class="forge-textarea font-mono text-sm" name="bioMarkdown" placeholder="# Early life&#10;&#10;Write the long-form biography here.">{form?.values?.bioMarkdown ?? ''}</textarea>
		</label>

		<div class="space-y-2">
			<span class="text-sm font-medium text-surface-800">Trait values JSON</span>
			<textarea class="forge-textarea min-h-48 font-mono text-sm" name="traitValues" spellcheck="false">{traitValues()}</textarea>
			<p class="text-xs leading-6 text-surface-600">This template is derived from the currently selected universe. If you switch universes before submitting, update the JSON keys to match that universe’s trait definitions.</p>
		</div>

		{#if form?.message}
			<p class="rounded-2xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-900">{form.message}</p>
		{/if}

		<button class="forge-button w-full" type="submit">Create character</button>
	</form>

	<aside class="space-y-5">
		<div class="forge-panel p-6">
			<p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Selected universe</p>
			<h3 class="mt-3 text-2xl font-semibold text-surface-950">{selectedUniverse().name}</h3>
			<p class="mt-3 text-sm leading-7 text-surface-700">{selectedUniverse().summary || 'No universe summary provided yet.'}</p>
		</div>

		<div class="forge-panel p-6">
			<h3 class="text-xl font-semibold text-surface-950">Available trait definitions</h3>
			{#if selectedUniverse().traitDefinitions.length === 0}
				<p class="mt-3 text-sm text-surface-700">This universe does not have any trait definitions yet.</p>
			{:else}
				<ul class="mt-4 space-y-3">
					{#each selectedUniverse().traitDefinitions as definition (definition.id)}
						<li class="rounded-2xl border border-surface-200 bg-white/75 p-4">
							<div class="flex items-center justify-between gap-4">
								<p class="font-semibold text-surface-950">{definition.label}</p>
								<span class="text-xs uppercase tracking-[0.18em] text-surface-600">{definition.valueType}</span>
							</div>
							<p class="mt-1 text-sm text-surface-700">Key: <span class="font-mono">{definition.key}</span></p>
							{#if definition.description}
								<p class="mt-2 text-sm leading-6 text-surface-700">{definition.description}</p>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</aside>
</section>

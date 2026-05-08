<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Respect user's selection after a failed submit
	let selectedUniverseId = $state(form?.values?.universeId ?? data.selectedUniverseId);
	let name = $state(form?.values?.name ?? '');
	let summary = $state(form?.values?.summary ?? '');
	let bioMarkdown = $state(form?.values?.bioMarkdown ?? '');

	// Pre-parse options for each trait to avoid JSON.parse in the template
	let traitOptions: Record<string, string[]> = {};
	$effect(() => {
		const universe = data.universes.find((u) => u.id === selectedUniverseId);
		if (!universe) return;
		traitOptions = {};
		for (const def of universe.traitDefinitions) {
			if (def.valueType === 'json' && def.optionsJson !== '[]') {
				try {
					traitOptions[def.key] = JSON.parse(def.optionsJson);
				} catch {
					traitOptions[def.key] = [];
				}
			} else {
				traitOptions[def.key] = [];
			}
		}
	});

	function selectedUniverse() {
		return data.universes.find((u) => u.id === selectedUniverseId) ?? data.universes[0];
	}

	function getTraitValue(key: string): string | undefined {
		return form?.values?.[`trait__${key}`];
	}

	function isRequiredField(key: string): boolean {
		const def = selectedUniverse().traitDefinitions.find((d) => d.key === key);
		if (!def || !def.isRequired) return false;
		// Only show errors after a failed submit (form.values exists but is incomplete)
		return !!form?.values && form.values[`trait__${key}`] === undefined;
	}

	function getOptions(key: string): string[] {
		return traitOptions[key] ?? [];
	}
</script>

<section class="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
	<form class="forge-panel space-y-5 p-8" method="POST">
		<div>
			<span class="forge-badge">Create character</span>
			<h2 class="mt-3 text-3xl font-semibold text-surface-950">Build a new character profile</h2>
		</div>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800">Universe</span>
			<select class="forge-select" name="universeId" bind:value={selectedUniverseId} required>
				{#each data.universes as universeOption (universeOption.id)}
					<option value={universeOption.id}>{universeOption.name}</option>
				{/each}
			</select>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800">Character name</span>
			<input class="forge-input" name="name" value={name} placeholder="Captain Ilyra Voss" required oninput={(e) => name = (e.target as HTMLInputElement).value} />
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800">Summary</span>
			<textarea class="forge-textarea" name="summary" placeholder="A concise card view summary." oninput={(e) => summary = (e.target as HTMLTextAreaElement).value}>{summary}</textarea>
		</label>

		<label class="block space-y-2">
			<span class="text-sm font-medium text-surface-800">Bio markdown</span>
			<textarea class="forge-textarea font-mono text-sm" name="bioMarkdown" placeholder="# Early life&#10;&#10;Write the long-form biography here." oninput={(e) => bioMarkdown = (e.target as HTMLTextAreaElement).value}>{bioMarkdown}</textarea>
		</label>

		<div class="space-y-3">
			<span class="text-sm font-medium text-surface-800">Trait values</span>
			{#if selectedUniverse().traitDefinitions.length === 0}
				<p class="text-sm text-surface-600 italic">This universe has no trait definitions yet.</p>
			{:else}
				<div class="space-y-3">
					{#each selectedUniverse().traitDefinitions as definition (definition.key)}
						<div class="rounded-2xl border border-surface-200 bg-white/75 p-4">
							<label class="block space-y-1">
								<span class="text-sm font-medium text-surface-800">
									{definition.label}
									{#if definition.isRequired}<span class="text-error-600 ml-1">*</span>{/if}
								</span>
								{#if definition.description}
									<span class="block text-xs text-surface-500">{definition.description}</span>
								{/if}

								{#if definition.valueType === 'boolean'}
									<!-- Hidden input ensures unchecked = "false" is always submitted -->
									<input type="hidden" name={`trait__${definition.key}`} value="false" />
									<div class="mt-2 flex cursor-pointer items-center gap-3">
										<input
											class="peer sr-only"
											type="checkbox"
											name={`trait__${definition.key}`}
											value="true"
											checked={getTraitValue(definition.key) === 'true'}
										/>
										<span class="relative inline-block h-6 w-11 rounded-full bg-surface-300 transition peer-checked:bg-primary-600">
											<span class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5"></span>
										</span>
										<span class="text-sm text-surface-700 peer-checked:text-primary-700">
											{getTraitValue(definition.key) === 'true' ? 'Yes' : 'No'}
										</span>
									</div>
								{:else if definition.valueType === 'number'}
									<input
										class="mt-2 forge-input font-mono"
										type="number"
										name={`trait__${definition.key}`}
										value={getTraitValue(definition.key) || ''}
										placeholder="0"
										step="any"
									/>
								{:else if definition.valueType === 'json' && getOptions(definition.key).length > 0}
									<select class="mt-2 forge-select" name={`trait__${definition.key}`}>
										<option value="">— select —</option>
										{#each getOptions(definition.key) as option}
											<option value={option} selected={getTraitValue(definition.key) === option}>{option}</option>
										{/each}
									</select>
								{:else if definition.valueType === 'json'}
									<textarea
										class="mt-2 forge-textarea font-mono text-sm"
										name={`trait__${definition.key}`}
										placeholder='{"key": "value"}'
									>{getTraitValue(definition.key) || ''}</textarea>
								{:else}
									<input
										class="mt-2 forge-input"
										type="text"
										name={`trait__${definition.key}`}
										value={getTraitValue(definition.key) || ''}
										placeholder={definition.description || `Enter ${definition.label.toLowerCase()}`}
									/>
								{/if}
							</label>

							{#if isRequiredField(definition.key)}
								<p class="mt-2 text-xs text-error-600">This field is required.</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
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

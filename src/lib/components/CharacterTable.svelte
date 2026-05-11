<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';

	type Character = {
		id: string;
		name: string;
		summary: string | null;
		traitValues: Record<string, string>;
		universeName: string;
		universeId: string;
		createdAt: Date;
		updatedAt: Date;
	};

	type TraitDef = {
		id: string;
		key: string;
		label: string;
		valueType: string;
	};

	type Universe = {
		id: string;
		name: string;
	};

	type FormResult = {
		action: 'create' | 'update';
		success?: boolean;
		message?: string;
		characterId?: string;
	} | null;

	let {
		characters,
		traitDefinitions,
		universes,
		selectedUniverseId,
		form
	}: {
		characters: Character[];
		traitDefinitions: TraitDef[];
		universes: Universe[];
		selectedUniverseId: string | null;
		form: FormResult;
	} = $props();

	let editingId = $state<string | null>(null);
	let showCreateRow = $state(false);

	let editName = $state('');
	let editSummary = $state('');
	let editTraits = $state<Record<string, string>>({});

	let newName = $state('');
	let newSummary = $state('');
	let newUniverseId = $state(untrack(() => selectedUniverseId ?? universes[0]?.id ?? ''));
	let newTraits = $state<Record<string, string>>({});

	let colCount = $derived(4 + traitDefinitions.length + (selectedUniverseId ? 0 : 1));

	function displayTrait(trait: TraitDef, value: string): string {
		if (!value) return '—';
		if (trait.valueType === 'boolean') return value === 'true' ? 'Yes' : 'No';
		return value;
	}

	function setUniverse(universeId: string) {
		editingId = null;
		showCreateRow = false;
		if (universeId) {
			goto(resolve(`/characters/table/${universeId}`), { noScroll: true });
		} else {
			goto(resolve('/characters/table'), { noScroll: true });
		}
	}

	function startEdit(character: Character) {
		showCreateRow = false;
		editingId = character.id;
		editName = character.name;
		editSummary = character.summary ?? '';
		editTraits = { ...character.traitValues };
	}

	function cancelEdit() {
		editingId = null;
	}

	function startCreate() {
		editingId = null;
		showCreateRow = true;
		newName = '';
		newSummary = '';
		newUniverseId = selectedUniverseId ?? universes[0]?.id ?? '';
		newTraits = Object.fromEntries(traitDefinitions.map((td) => [td.key, '']));
	}

	function cancelCreate() {
		showCreateRow = false;
	}

	function rowError(characterId: string): string | null {
		if (form?.action === 'update' && form.message && form.characterId === characterId) {
			return form.message;
		}
		return null;
	}

	let createError = $derived(form?.action === 'create' && form.message ? form.message : null);
</script>

<!-- Universe filter bar -->
<div class="forge-panel flex flex-wrap items-center gap-3 px-5 py-3">
	<span class="text-xs font-semibold tracking-[0.16em] text-surface-500 uppercase">Universe</span>
	<div class="flex flex-wrap gap-2">
		<button
			type="button"
			onclick={() => setUniverse('')}
			class={!selectedUniverseId
				? 'forge-button py-1.5 text-xs'
				: 'forge-button-ghost py-1.5 text-xs'}
		>
			All
		</button>
		{#each universes as u (u.id)}
			<button
				type="button"
				onclick={() => setUniverse(u.id)}
				class={selectedUniverseId === u.id
					? 'forge-button py-1.5 text-xs'
					: 'forge-button-ghost py-1.5 text-xs'}
			>
				{u.name}
			</button>
		{/each}
	</div>
	{#if !selectedUniverseId && traitDefinitions.length === 0}
		<span class="ml-auto text-xs text-surface-400">Select a universe to show trait columns</span
		>
	{/if}
</div>

<!-- Forms live outside the table for valid HTML -->
<form
	id="form-create"
	method="POST"
	action="?/create"
	class="hidden"
	use:enhance={() =>
		async ({ result, update }) => {
			if (result.type === 'success') {
				showCreateRow = false;
				newName = '';
				newSummary = '';
				newTraits = Object.fromEntries(traitDefinitions.map((td) => [td.key, '']));
			}
			await update();
		}}
>
	{#if selectedUniverseId}
		<input type="hidden" name="universeId" value={selectedUniverseId} />
	{/if}
</form>

{#each characters as character (character.id)}
	<form
		id="form-edit-{character.id}"
		method="POST"
		action="?/update"
		class="hidden"
		use:enhance={() =>
			async ({ result, update }) => {
				if (result.type === 'success') editingId = null;
				await update();
			}}
	>
		<input type="hidden" name="characterId" value={character.id} />
	</form>
{/each}

<!-- Table -->
<div class="forge-panel overflow-hidden">
	<div class="overflow-x-auto">
		<table class="forge-table">
			<thead>
				<tr>
					{#if !selectedUniverseId}
						<th class="w-32">Universe</th>
					{/if}
					<th class="sticky left-0 min-w-36 bg-surface-50 lg:min-w-40 dark:bg-surface-900"
						>Name</th
					>
					<th class="min-w-48">Summary</th>
					{#each traitDefinitions as td (td.id)}
						<th class="min-w-28">{td.label}</th>
					{/each}
					<th class="w-24">Updated</th>
					<th class="sticky right-0 w-32 bg-surface-50 lg:min-w-40 dark:bg-surface-900"
						>Actions</th
					>
				</tr>
			</thead>
			<tbody>
				<!-- Create row -->
				{#if showCreateRow}
					<tr class="forge-table-editing">
						{#if !selectedUniverseId}
							<td>
								<select
									class="forge-select py-1 text-xs"
									name="universeId"
									form="form-create"
									bind:value={newUniverseId}
								>
									{#each universes as u (u.id)}
										<option value={u.id}>{u.name}</option>
									{/each}
								</select>
							</td>
						{/if}
						<td>
							<input
								class="forge-input py-1 text-xs"
								name="name"
								form="form-create"
								bind:value={newName}
								placeholder="Name"
								required
							/>
						</td>
						<td>
							<input
								class="forge-input py-1 text-xs"
								name="summary"
								form="form-create"
								bind:value={newSummary}
								placeholder="Summary"
							/>
						</td>
						{#each traitDefinitions as td (td.id)}
							<td>
								{#if td.valueType === 'boolean'}
									<select
										class="forge-select py-1 text-xs"
										name="trait:{td.key}"
										form="form-create"
										bind:value={newTraits[td.key]}
									>
										<option value="">—</option>
										<option value="true">Yes</option>
										<option value="false">No</option>
									</select>
								{:else if td.valueType === 'number'}
									<input
										type="number"
										class="forge-input py-1 text-xs"
										name="trait:{td.key}"
										form="form-create"
										bind:value={newTraits[td.key]}
									/>
								{:else if td.valueType === 'date'}
									<input
										type="date"
										class="forge-input py-1 text-xs"
										name="trait:{td.key}"
										form="form-create"
										bind:value={newTraits[td.key]}
									/>
								{:else}
									<input
										type="text"
										class="forge-input py-1 text-xs"
										name="trait:{td.key}"
										form="form-create"
										bind:value={newTraits[td.key]}
									/>
								{/if}
							</td>
						{/each}
						<td class="text-xs text-surface-400">—</td>
						<td class="sticky right-0 bg-surface-50 dark:bg-surface-900">
							<div class="flex flex-wrap items-center gap-1.5">
								<button
									class="forge-button px-3 py-1 text-xs"
									type="submit"
									form="form-create"
									disabled={!newName.trim()}
								>
									Add
								</button>
								<button
									type="button"
									class="forge-button-ghost px-3 py-1 text-xs"
									onclick={cancelCreate}
								>
									Cancel
								</button>
							</div>
							{#if createError}
								<p class="mt-1 text-xs text-error-600">{createError}</p>
							{/if}
						</td>
					</tr>
				{/if}

				{#each characters as character (character.id)}
					{#if editingId === character.id}
						<!-- Edit row -->
						<tr class="forge-table-editing">
							{#if !selectedUniverseId}
								<td>
									<span class="forge-badge text-xs">{character.universeName}</span
									>
								</td>
							{/if}
							<td class="sticky left-0 bg-surface-50 dark:bg-surface-900">
								<input
									class="forge-input py-1 text-xs"
									name="name"
									form="form-edit-{character.id}"
									bind:value={editName}
									required
								/>
							</td>
							<td>
								<input
									class="forge-input py-1 text-xs"
									name="summary"
									form="form-edit-{character.id}"
									bind:value={editSummary}
								/>
							</td>
							{#each traitDefinitions as td (td.id)}
								<td>
									{#if td.valueType === 'boolean'}
										<select
											class="forge-select py-1 text-xs"
											name="trait:{td.key}"
											form="form-edit-{character.id}"
											bind:value={editTraits[td.key]}
										>
											<option value="">—</option>
											<option value="true">Yes</option>
											<option value="false">No</option>
										</select>
									{:else if td.valueType === 'number'}
										<input
											type="number"
											class="forge-input py-1 text-xs"
											name="trait:{td.key}"
											form="form-edit-{character.id}"
											bind:value={editTraits[td.key]}
										/>
									{:else if td.valueType === 'date'}
										<input
											type="date"
											class="forge-input py-1 text-xs"
											name="trait:{td.key}"
											form="form-edit-{character.id}"
											bind:value={editTraits[td.key]}
										/>
									{:else}
										<input
											type="text"
											class="forge-input py-1 text-xs"
											name="trait:{td.key}"
											form="form-edit-{character.id}"
											bind:value={editTraits[td.key]}
										/>
									{/if}
								</td>
							{/each}
							<td class="text-xs text-surface-400">—</td>
							<td class="sticky right-0 bg-surface-50 dark:bg-surface-900">
								<div class="flex flex-wrap items-center gap-1.5">
									<button
										class="forge-button px-3 py-1 text-xs"
										type="submit"
										form="form-edit-{character.id}"
										disabled={!editName.trim()}
									>
										Save
									</button>
									<button
										type="button"
										class="forge-button-ghost px-3 py-1 text-xs"
										onclick={cancelEdit}
									>
										Cancel
									</button>
								</div>
								{#if rowError(character.id)}
									<p class="mt-1 text-xs text-error-600">
										{rowError(character.id)}
									</p>
								{/if}
							</td>
						</tr>
					{:else}
						<!-- View row -->
						<tr>
							{#if !selectedUniverseId}
								<td>
									<span class="forge-badge text-xs">{character.universeName}</span
									>
								</td>
							{/if}
							<td
								class="sticky left-0 bg-surface-50 font-medium text-surface-950 dark:bg-surface-900 dark:text-surface-50"
							>
								<a class="forge-link" href={resolve(`/characters/${character.id}`)}>
									{character.name}
								</a>
							</td>
							<td class="max-w-[200px] text-surface-600 dark:text-surface-400">
								<span class="line-clamp-1 text-xs">{character.summary || '—'}</span>
							</td>
							{#each traitDefinitions as td (td.id)}
								<td class="max-w-[160px]">
									<span
										class="line-clamp-1 text-xs text-surface-600 dark:text-surface-400"
									>
										{displayTrait(td, character.traitValues[td.key] ?? '')}
									</span>
								</td>
							{/each}
							<td class="text-xs whitespace-nowrap text-surface-500">
								{character.updatedAt.toLocaleDateString()}
							</td>
							<td class="sticky right-0 bg-surface-50 dark:bg-surface-900">
								<div class="flex items-center gap-2">
									<button
										type="button"
										class="forge-button-ghost px-3 py-1 text-xs"
										onclick={() => startEdit(character)}
									>
										Edit
									</button>
								</div>
							</td>
						</tr>
					{/if}
				{/each}

				{#if characters.length === 0 && !showCreateRow}
					<tr>
						<td colspan={colCount} class="py-10 text-center text-sm text-surface-400">
							{selectedUniverseId
								? 'No characters in this universe yet.'
								: 'No characters yet.'}
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>

	<div
		class="flex items-center justify-between border-t border-surface-100 px-4 py-3 dark:border-surface-800"
	>
		<span class="text-xs text-surface-500">
			{characters.length}
			{characters.length === 1 ? 'character' : 'characters'}
			{selectedUniverseId ? 'in this universe' : 'total'}
		</span>
		{#if !showCreateRow && universes.length > 0}
			<button
				type="button"
				class="forge-button-ghost px-4 py-1.5 text-xs"
				onclick={startCreate}
			>
				+ Add character
			</button>
		{/if}
	</div>
</div>

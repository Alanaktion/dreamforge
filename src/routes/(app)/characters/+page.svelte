<script lang="ts">
	import { untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type Character = (typeof data.characters)[number];
	type TraitDef = (typeof data.traitDefinitions)[number];

	let viewMode = $state<'card' | 'table'>(
		untrack(() => (page.url.searchParams.get('view') === 'table' ? 'table' : 'card'))
	);

	let editingId = $state<string | null>(null);
	let showCreateRow = $state(false);

	let editName = $state('');
	let editSummary = $state('');
	let editTraits = $state<Record<string, string>>({});

	let newName = $state('');
	let newSummary = $state('');
	let newUniverseId = $state(untrack(() => data.selectedUniverseId ?? data.universes[0]?.id ?? ''));
	let newTraits = $state<Record<string, string>>({});

	let colCount = $derived(4 + data.traitDefinitions.length + (data.selectedUniverseId ? 0 : 1));

	function displayTrait(trait: TraitDef, value: string): string {
		if (!value) return '—';
		if (trait.valueType === 'boolean') return value === 'true' ? 'Yes' : 'No';
		return value;
	}

	function setViewMode(mode: 'card' | 'table') {
		viewMode = mode;
		const { url } = page;
		url.searchParams.set('view', mode);
		if (mode === 'card') url.searchParams.delete('universe');
		// @ts-expect-error URL is known-safe
		goto(resolve(url.pathname + url.search), { replaceState: true, noScroll: true });
	}

	function setUniverse(universeId: string) {
		editingId = null;
		showCreateRow = false;
		const { url } = page;
		if (universeId) {
			url.searchParams.set('universe', universeId);
		} else {
			url.searchParams.delete('universe');
		}
		url.searchParams.set('view', 'table');
		// @ts-expect-error URL is known-safe
		goto(resolve(url.pathname + url.search), { noScroll: true });
	}

	function startEdit(character: Character) {
		showCreateRow = false;
		editingId = character.id;
		editName = character.name;
		editSummary = character.summary;
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
		newUniverseId = data.selectedUniverseId ?? data.universes[0]?.id ?? '';
		newTraits = Object.fromEntries(data.traitDefinitions.map((td) => [td.key, '']));
	}

	function cancelCreate() {
		showCreateRow = false;
	}

	function rowError(characterId: string): string | null {
		if (form && 'action' in form && form.action === 'update' && 'message' in form) {
			const f = form as { action: string; characterId?: string; message: string };
			if (f.characterId === characterId) return f.message;
		}
		return null;
	}

	let createError = $derived(
		form && 'action' in form && form.action === 'create' && 'message' in form
			? (form as { message: string }).message
			: null
	);
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
		<div
			class="flex overflow-hidden rounded-full border border-surface-300 dark:border-surface-600"
		>
			<button
				type="button"
				onclick={() => setViewMode('card')}
				class={viewMode === 'card'
					? 'forge-button rounded-none rounded-l-full border-0 shadow-none'
					: 'forge-button-ghost rounded-none rounded-l-full border-0 py-2'}
			>
				Cards
			</button>
			<button
				type="button"
				onclick={() => setViewMode('table')}
				class={viewMode === 'table'
					? 'forge-button rounded-none rounded-r-full border-0 shadow-none'
					: 'forge-button-ghost rounded-none rounded-r-full border-0 py-2'}
			>
				Table
			</button>
		</div>
		<a class="forge-button" href={resolve('/characters/create')}>Create a character</a>
	</div>

	{#if viewMode === 'card'}
		{#if data.characters.length === 0}
			<div class="forge-panel p-8 text-center">
				<h3 class="text-2xl font-semibold text-surface-950 dark:text-surface-50">
					No characters yet
				</h3>
				<p class="mt-3 text-surface-700 dark:text-surface-300">
					Create your first entry to start attaching trait data, markdown biographies, and
					gallery images.
				</p>
				<a class="forge-button mt-6" href={resolve('/characters/create')}
					>Open the character form</a
				>
			</div>
		{:else}
			<div class="forge-card-grid">
				{#each data.characters as character (character.id)}
					<article class="forge-panel flex h-full flex-col p-6">
						<div class="flex items-center justify-between gap-4">
							<span class="forge-badge">{character.universeName}</span>
							<span class="text-xs tracking-[0.18em] text-surface-600 uppercase"
								>Updated {character.updatedAt.toLocaleDateString()}</span
							>
						</div>

						<div class="mt-5 flex-1 space-y-3">
							<h3
								class="text-2xl font-semibold text-surface-950 dark:text-surface-50"
							>
								<a href={resolve(`/characters/${character.id}`)}>{character.name}</a
								>
							</h3>
							<p
								class="line-clamp-4 text-sm leading-7 text-surface-700 dark:text-surface-300"
							>
								{character.summary || 'No summary yet.'}
							</p>
						</div>

						<div class="mt-6 flex items-center justify-between gap-4">
							<span class="text-sm text-surface-600"
								>Created {character.createdAt.toLocaleDateString()}</span
							>
							<a
								class="forge-link text-sm font-semibold"
								href={resolve(`/characters/${character.id}`)}>Open profile</a
							>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	{:else}
		<!-- Universe filter bar -->
		<div class="forge-panel flex flex-wrap items-center gap-3 px-5 py-3">
			<span class="text-xs font-semibold tracking-[0.16em] text-surface-500 uppercase"
				>Universe</span
			>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					onclick={() => setUniverse('')}
					class={!data.selectedUniverseId
						? 'forge-button py-1.5 text-xs'
						: 'forge-button-ghost py-1.5 text-xs'}
				>
					All
				</button>
				{#each data.universes as u (u.id)}
					<button
						type="button"
						onclick={() => setUniverse(u.id)}
						class={data.selectedUniverseId === u.id
							? 'forge-button py-1.5 text-xs'
							: 'forge-button-ghost py-1.5 text-xs'}
					>
						{u.name}
					</button>
				{/each}
			</div>
			{#if !data.selectedUniverseId && data.traitDefinitions.length === 0}
				<span class="ml-auto text-xs text-surface-400"
					>Select a universe to show trait columns</span
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
						newTraits = Object.fromEntries(
							data.traitDefinitions.map((td) => [td.key, ''])
						);
					}
					await update();
				}}
		>
			{#if data.selectedUniverseId}
				<input type="hidden" name="universeId" value={data.selectedUniverseId} />
			{/if}
		</form>

		{#each data.characters as character (character.id)}
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
							{#if !data.selectedUniverseId}
								<th class="w-32">Universe</th>
							{/if}
							<th
								class="sticky left-0 min-w-36 bg-surface-50 lg:min-w-40 dark:bg-surface-900"
								>Name</th
							>
							<th class="min-w-48">Summary</th>
							{#each data.traitDefinitions as td (td.id)}
								<th class="min-w-28">{td.label}</th>
							{/each}
							<th class="w-24">Updated</th>
							<th
								class="sticky right-0 w-32 bg-surface-50 lg:min-w-40 dark:bg-surface-900"
								>Actions</th
							>
						</tr>
					</thead>
					<tbody>
						<!-- Create row -->
						{#if showCreateRow}
							<tr class="forge-table-editing">
								{#if !data.selectedUniverseId}
									<td>
										<select
											class="forge-select py-1 text-xs"
											name="universeId"
											form="form-create"
											bind:value={newUniverseId}
										>
											{#each data.universes as u (u.id)}
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
								{#each data.traitDefinitions as td (td.id)}
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

						{#each data.characters as character (character.id)}
							{#if editingId === character.id}
								<!-- Edit row -->
								<tr class="forge-table-editing">
									{#if !data.selectedUniverseId}
										<td>
											<span class="forge-badge text-xs"
												>{character.universeName}</span
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
									{#each data.traitDefinitions as td (td.id)}
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
									{#if !data.selectedUniverseId}
										<td>
											<span class="forge-badge text-xs"
												>{character.universeName}</span
											>
										</td>
									{/if}
									<td
										class="sticky left-0 bg-surface-50 font-medium text-surface-950 dark:bg-surface-900 dark:text-surface-50"
									>
										<a
											class="forge-link"
											href={resolve(`/characters/${character.id}`)}
										>
											{character.name}
										</a>
									</td>
									<td
										class="max-w-[200px] text-surface-600 dark:text-surface-400"
									>
										<span class="line-clamp-1 text-xs"
											>{character.summary || '—'}</span
										>
									</td>
									{#each data.traitDefinitions as td (td.id)}
										<td class="max-w-[160px]">
											<span
												class="line-clamp-1 text-xs text-surface-600 dark:text-surface-400"
											>
												{displayTrait(
													td,
													character.traitValues[td.key] ?? ''
												)}
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

						{#if data.characters.length === 0 && !showCreateRow}
							<tr>
								<td
									colspan={colCount}
									class="py-10 text-center text-sm text-surface-400"
								>
									{data.selectedUniverseId
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
					{data.characters.length}
					{data.characters.length === 1 ? 'character' : 'characters'}
					{data.selectedUniverseId ? 'in this universe' : 'total'}
				</span>
				{#if !showCreateRow && data.universes.length > 0}
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
	{/if}
</section>

<script lang="ts">
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type Character = (typeof data.characters)[number];

	let viewMode = $state<'card' | 'table'>('card');
	let editingId = $state<string | null>(null);
	let showCreateRow = $state(false);

	// Controlled inputs for the row being edited
	let editName = $state('');
	let editSummary = $state('');

	// Controlled inputs for the create row
	let newUniverseId = $state(untrack(() => data.universes[0]?.id ?? ''));
	let newName = $state('');
	let newSummary = $state('');

	function startEdit(character: Character) {
		editingId = character.id;
		editName = character.name;
		editSummary = character.summary;
	}

	function cancelEdit() {
		editingId = null;
	}

	function startCreate() {
		showCreateRow = true;
		newUniverseId = data.universes[0]?.id ?? '';
		newName = '';
		newSummary = '';
	}

	function cancelCreate() {
		showCreateRow = false;
	}

	// Check which row has a server error
	function rowError(characterId: string): string | null {
		if (form && !form.success && 'action' in form && form.action === 'update') {
			const f = form as { action: 'update'; characterId?: string; message?: string };
			if (f.characterId === characterId) return f.message ?? null;
		}
		return null;
	}

	let createError = $derived(
		form && !form.success && 'action' in form && form.action === 'create'
			? ((form as { message?: string }).message ?? null)
			: null
	);
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div>
			<h2
				class="mt-3 text-4xl font-semibold tracking-tight text-surface-950 dark:text-surface-50"
			>
				Your cast, organized by universe.
			</h2>
			<p class="mt-3 max-w-2xl text-base leading-7 text-surface-700 dark:text-surface-300">
				Each card is private to your account and grouped under the owning universe that
				defines its trait schema.
			</p>
		</div>

		<div class="flex shrink-0 items-center gap-3">
			<!-- View toggle -->
			<div
				class="flex overflow-hidden rounded-full border border-surface-300 dark:border-surface-600"
			>
				<button
					type="button"
					onclick={() => (viewMode = 'card')}
					class={viewMode === 'card'
						? 'forge-button rounded-none rounded-l-full border-0 shadow-none'
						: 'forge-button-ghost rounded-none rounded-l-full border-0 py-2'}
				>
					Cards
				</button>
				<button
					type="button"
					onclick={() => (viewMode = 'table')}
					class={viewMode === 'table'
						? 'forge-button rounded-none rounded-r-full border-0 shadow-none'
						: 'forge-button-ghost rounded-none rounded-r-full border-0 py-2'}
				>
					Table
				</button>
			</div>
			<a class="forge-button" href="/characters/create">Create a character</a>
		</div>
	</div>

	{#if data.characters.length === 0 && viewMode === 'card'}
		<div class="forge-panel p-8 text-center">
			<h3 class="text-2xl font-semibold text-surface-950 dark:text-surface-50">
				No characters yet
			</h3>
			<p class="mt-3 text-surface-700 dark:text-surface-300">
				Create your first entry to start attaching trait data, markdown biographies, and
				gallery images.
			</p>
			<a class="forge-button mt-6" href="/characters/create">Open the character form</a>
		</div>
	{:else if viewMode === 'card'}
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
						<h3 class="text-2xl font-semibold text-surface-950 dark:text-surface-50">
							<a href={`/characters/${character.id}`}>{character.name}</a>
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
							href={`/characters/${character.id}`}>Open profile</a
						>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<!-- Table view -->
		<div class="forge-panel overflow-hidden">
			<div class="overflow-x-auto">
				<table class="forge-table">
					<thead>
						<tr>
							<th class="w-36">Universe</th>
							<th class="min-w-40">Name</th>
							<th>Summary</th>
							<th class="w-32">Updated</th>
							<th class="w-48">Actions</th>
						</tr>
					</thead>
					<tbody>
						<!-- Create row -->
						{#if showCreateRow}
							<tr class="forge-table-editing">
								<td>
									{#if data.universes.length > 0}
										<select
											class="forge-select py-2 text-xs"
											bind:value={newUniverseId}
											form="form-create"
											name="universeId"
										>
											{#each data.universes as u (u.id)}
												<option value={u.id}>{u.name}</option>
											{/each}
										</select>
									{:else}
										<span class="text-surface-400">No universes</span>
									{/if}
								</td>
								<td>
									<input
										class="forge-input py-2 text-sm"
										placeholder="Character name"
										bind:value={newName}
										form="form-create"
										name="name"
										required
									/>
								</td>
								<td>
									<input
										class="forge-input py-2 text-sm"
										placeholder="Brief summary…"
										bind:value={newSummary}
										form="form-create"
										name="summary"
									/>
								</td>
								<td class="text-surface-400">—</td>
								<td>
									<div class="flex flex-wrap items-center gap-2">
										<button
											class="forge-button px-4 py-1.5 text-xs"
											type="submit"
											form="form-create"
											disabled={!newName.trim() || !newUniverseId}
										>
											Add
										</button>
										<button
											type="button"
											class="forge-button-ghost px-3 py-1.5 text-xs"
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

							<!-- Hidden form for create row (outside table isn't needed; we use form attr) -->
							<tr class="hidden">
								<td>
									<form
										id="form-create"
										method="POST"
										action="?/create"
										use:enhance={() => {
											return async ({ result, update }) => {
												if (result.type === 'success') {
													showCreateRow = false;
												}
												await update();
											};
										}}
									></form>
								</td>
							</tr>
						{/if}

						{#each data.characters as character (character.id)}
							{#if editingId === character.id}
								<!-- Edit row -->
								<tr class="forge-table-editing">
									<td>
										<span class="forge-badge text-xs"
											>{character.universeName}</span
										>
									</td>
									<td>
										<input
											class="forge-input py-2 text-sm"
											placeholder="Character name"
											bind:value={editName}
											form="form-edit-{character.id}"
											name="name"
											required
										/>
										<input
											type="hidden"
											form="form-edit-{character.id}"
											name="characterId"
											value={character.id}
										/>
									</td>
									<td>
										<input
											class="forge-input py-2 text-sm"
											placeholder="Brief summary…"
											bind:value={editSummary}
											form="form-edit-{character.id}"
											name="summary"
										/>
									</td>
									<td class="text-surface-400">—</td>
									<td>
										<div class="flex flex-wrap items-center gap-2">
											<button
												class="forge-button px-4 py-1.5 text-xs"
												type="submit"
												form="form-edit-{character.id}"
												disabled={!editName.trim()}
											>
												Save
											</button>
											<button
												type="button"
												class="forge-button-ghost px-3 py-1.5 text-xs"
												onclick={cancelEdit}
											>
												Cancel
											</button>
											<a
												class="forge-link text-xs"
												href={`/characters/${character.id}/edit`}
											>
												Full edit ↗
											</a>
										</div>
										{#if rowError(character.id)}
											<p class="mt-1 text-xs text-error-600">
												{rowError(character.id)}
											</p>
										{/if}
									</td>
								</tr>

								<!-- Hidden form for this edit row -->
								<tr class="hidden">
									<td>
										<form
											id="form-edit-{character.id}"
											method="POST"
											action="?/update"
											use:enhance={() => {
												return async ({ result, update }) => {
													if (result.type === 'success') {
														editingId = null;
													}
													await update();
												};
											}}
										></form>
									</td>
								</tr>
							{:else}
								<!-- Normal row -->
								<tr>
									<td>
										<span class="forge-badge text-xs"
											>{character.universeName}</span
										>
									</td>
									<td class="font-medium text-surface-950 dark:text-surface-50">
										<a class="forge-link" href={`/characters/${character.id}`}>
											{character.name}
										</a>
									</td>
									<td class="max-w-xs text-surface-600 dark:text-surface-400">
										<span class="line-clamp-2">{character.summary || '—'}</span>
									</td>
									<td class="whitespace-nowrap text-surface-500">
										{character.updatedAt.toLocaleDateString()}
									</td>
									<td>
										<div class="flex items-center gap-2">
											<button
												type="button"
												class="forge-button-ghost px-3 py-1.5 text-xs"
												onclick={() => startEdit(character)}
											>
												Edit
											</button>
											<a
												class="forge-link text-xs"
												href={`/characters/${character.id}`}
											>
												Open ↗
											</a>
										</div>
									</td>
								</tr>
							{/if}
						{/each}

						{#if data.characters.length === 0 && !showCreateRow}
							<tr>
								<td colspan="5" class="py-8 text-center text-surface-400">
									No characters yet.
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</div>

			<!-- Table footer -->
			<div
				class="flex items-center justify-between border-t border-surface-100 px-4 py-3 dark:border-surface-800"
			>
				<span class="text-xs text-surface-500">
					{data.characters.length}
					{data.characters.length === 1 ? 'character' : 'characters'}
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

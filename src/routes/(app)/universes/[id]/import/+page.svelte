<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	type TraitValueType = 'text' | 'paragraph' | 'number' | 'boolean' | 'date' | 'json';

	type ColumnMapping =
		| { type: 'skip' }
		| { type: 'name' }
		| { type: 'summary' }
		| { type: 'bio' }
		| { type: 'trait'; key: string }
		| { type: 'new_trait'; label: string; key: string; valueType: TraitValueType };

	type ColumnState = {
		selectValue: string; // 'skip' | 'name' | 'trait:KEY' | 'new_trait'
		newLabel: string;
		newKey: string;
		newValueType: TraitValueType;
		autoKey: boolean;
	};

	function generateKey(label: string): string {
		return label
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '_')
			.replace(/[^a-z0-9_]/g, '');
	}

	function autoMappingToSelectValue(mapping: ColumnMapping): string {
		if (mapping.type === 'name') return 'name';
		if (mapping.type === 'summary') return 'summary';
		if (mapping.type === 'bio') return 'bio';
		if (mapping.type === 'trait') return `trait:${mapping.key}`;
		return 'skip';
	}

	function buildColumnsFromForm(): ColumnState[] {
		if (form?.step !== 'map') return [];
		return (form.autoMappings as ColumnMapping[]).map((m, i) => {
			const headerLabel = form.headers[i] ?? '';
			return {
				selectValue: autoMappingToSelectValue(m),
				newLabel: headerLabel,
				newKey: generateKey(headerLabel),
				newValueType: 'text' as TraitValueType,
				autoKey: true
			};
		});
	}

	// Re-initialize columns whenever a new upload result arrives (tempFileId changes)
	let columnsKey = $derived(form?.step === 'map' ? form.tempFileId : '');
	let columns = $state<ColumnState[]>(untrack(buildColumnsFromForm));
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		columnsKey; // track key
		columns = untrack(buildColumnsFromForm);
	});

	function handleNewLabelInput(col: ColumnState) {
		if (col.autoKey) {
			col.newKey = generateKey(col.newLabel);
		}
	}

	function handleNewKeyInput(col: ColumnState) {
		col.autoKey = false;
	}

	function buildColumnMappings(): ColumnMapping[] {
		return columns.map((col): ColumnMapping => {
			if (col.selectValue === 'name') return { type: 'name' };
			if (col.selectValue === 'summary') return { type: 'summary' };
			if (col.selectValue === 'bio') return { type: 'bio' };
			if (col.selectValue.startsWith('trait:'))
				return { type: 'trait', key: col.selectValue.slice(6) };
			if (col.selectValue === 'new_trait')
				return {
					type: 'new_trait',
					label: col.newLabel,
					key: col.newKey || generateKey(col.newLabel),
					valueType: col.newValueType
				};
			return { type: 'skip' };
		});
	}

	let columnMappingsJson = $derived(JSON.stringify(buildColumnMappings()));

	let nameCols = $derived(columns.filter((c) => c.selectValue === 'name').length);
	let traitCols = $derived(
		columns.filter((c) => c.selectValue.startsWith('trait:') || c.selectValue === 'new_trait')
			.length
	);
	let newTraitCols = $derived(columns.filter((c) => c.selectValue === 'new_trait').length);
	let skipCols = $derived(columns.filter((c) => c.selectValue === 'skip').length);

	let canImport = $derived(
		nameCols > 0 &&
			columns.every(
				(c) =>
					c.selectValue !== 'new_trait' ||
					(c.newLabel.trim().length > 0 && (c.newKey || generateKey(c.newLabel)).length > 0)
			)
	);
</script>

<section class="space-y-8">
	<div>
		<a class="forge-link text-sm" href={resolve(`/universes/${data.universe.id}`)}>
			← {data.universe.name}
		</a>
	</div>

	<div>
		<span class="forge-badge">Characters</span>
		<h2 class="mt-3 text-2xl font-semibold text-surface-950 dark:text-surface-50">
			Import from CSV
		</h2>
		<p class="mt-2 max-w-2xl text-sm leading-6 text-surface-700 dark:text-surface-300">
			Upload a CSV file to import characters into <strong>{data.universe.name}</strong>. The first
			row must be a header row. You'll map each column to a character field before importing.
		</p>
	</div>

	<!-- ── Step: results ──────────────────────────────────────────────────── -->
	{#if form?.step === 'results'}
		<div class="forge-panel space-y-4 p-6">
			{#if form.imported > 0}
				<p
					class="rounded-2xl border border-success-300 bg-success-50 px-4 py-3 text-sm text-success-900"
				>
					✓ {form.imported} character{form.imported === 1 ? '' : 's'} imported successfully.
				</p>
			{/if}
			{#if form.failed.length > 0}
				<div
					class="rounded-2xl border border-warning-300 bg-warning-50 px-4 py-3 dark:border-warning-800 dark:bg-warning-950/40"
				>
					<p class="text-sm font-medium text-warning-900 dark:text-warning-200">
						⚠ {form.failed.length} row{form.failed.length === 1 ? '' : 's'} could not be imported:
					</p>
					<ul class="mt-2 space-y-1">
						{#each form.failed as failure}
							<li class="text-sm text-warning-800 dark:text-warning-300">
								<span class="font-medium">Row {failure.row}:</span>
								{failure.reason}
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			<a
				class="forge-button inline-block"
				href={resolve(`/characters/table?universe=${data.universe.id}`)}
			>
				View characters
			</a>
		</div>

	<!-- ── Step: map ──────────────────────────────────────────────────────── -->
	{:else if form?.step === 'map'}
		<div class="space-y-6">
			<!-- Summary counts -->
			<div class="flex flex-wrap gap-3">
				<span
					class="rounded-full border border-surface-200 px-3 py-1 text-xs font-medium text-surface-700 dark:border-surface-700 dark:text-surface-300"
				>
					{form.totalRows} data row{form.totalRows === 1 ? '' : 's'}
				</span>
				<span
					class="rounded-full border px-3 py-1 text-xs font-medium {nameCols > 0
						? 'border-success-300 text-success-800 dark:border-success-700 dark:text-success-300'
						: 'border-warning-300 text-warning-800 dark:border-warning-700 dark:text-warning-300'}"
				>
					{nameCols} name column{nameCols === 1 ? '' : 's'}
				</span>
				<span
					class="rounded-full border border-surface-200 px-3 py-1 text-xs font-medium text-surface-700 dark:border-surface-700 dark:text-surface-300"
				>
					{traitCols} trait column{traitCols === 1 ? '' : 's'}
					{#if newTraitCols > 0}({newTraitCols} new){/if}
				</span>
				{#if skipCols > 0}
					<span
						class="rounded-full border border-surface-200 px-3 py-1 text-xs font-medium text-surface-500 dark:border-surface-700"
					>
						{skipCols} skipped
					</span>
				{/if}
			</div>

			{#if nameCols === 0}
				<p
					class="rounded-2xl border border-warning-300 bg-warning-50 px-4 py-3 text-sm text-warning-900 dark:border-warning-800 dark:bg-warning-950/40 dark:text-warning-200"
				>
					⚠ At least one column must be mapped to <strong>Character name</strong>.
				</p>
			{/if}

			<!-- Column mapping table -->
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-surface-200 dark:border-surface-800">
							<th
								class="pb-3 pr-4 text-left text-xs font-semibold tracking-[0.1em] text-surface-500 uppercase"
								>Column</th
							>
							<th
								class="pb-3 pr-4 text-left text-xs font-semibold tracking-[0.1em] text-surface-500 uppercase"
								>Sample values</th
							>
							<th
								class="pb-3 text-left text-xs font-semibold tracking-[0.1em] text-surface-500 uppercase"
								>Map to</th
							>
						</tr>
					</thead>
					<tbody class="divide-y divide-surface-100 dark:divide-surface-800">
						{#each form.headers as header, i}
							{@const col = columns[i]}
							<tr class="align-top">
								<td class="py-3 pr-4 font-medium text-surface-900 dark:text-surface-100">
									{#if header}
										{header}
									{:else}
										<em class="text-surface-400">(empty)</em>
									{/if}
								</td>
								<td class="py-3 pr-4 text-surface-600 dark:text-surface-400">
									{#each form.sampleRows as row}
										{#if row[i]}
											<div class="truncate max-w-[200px]">{row[i]}</div>
										{/if}
									{/each}
								</td>
								<td class="py-3">
									{#if col}
										<div class="space-y-2">
											<select class="forge-select text-sm" bind:value={col.selectValue}>
												<option value="skip">Skip this column</option>
												<option value="name">Character name</option>
												<option value="summary">Character summary</option>
												<option value="bio">Character bio (Markdown)</option>
												{#each data.traitDefinitions as trait}
													<option value="trait:{trait.key}"
														>{trait.label}
														{trait.category ? `(${trait.category})` : ''}</option
													>
												{/each}
												<option value="new_trait">+ Create new trait…</option>
											</select>

											{#if col.selectValue === 'new_trait'}
												<div
													class="grid gap-2 rounded-xl border border-surface-200 p-3 dark:border-surface-700 sm:grid-cols-3"
												>
													<label class="block space-y-1">
														<span class="text-xs font-medium text-surface-600 dark:text-surface-400"
															>Label <span class="text-error-500">*</span></span
														>
														<input
															class="forge-input text-sm"
															placeholder="e.g. Backstory"
															bind:value={col.newLabel}
															oninput={() => handleNewLabelInput(col)}
														/>
													</label>
													<label class="block space-y-1">
														<span class="text-xs font-medium text-surface-600 dark:text-surface-400"
															>Key <span class="text-error-500">*</span></span
														>
														<input
															class="forge-input font-mono text-sm"
															placeholder="backstory"
															bind:value={col.newKey}
															oninput={() => handleNewKeyInput(col)}
														/>
													</label>
													<label class="block space-y-1">
														<span class="text-xs font-medium text-surface-600 dark:text-surface-400"
															>Type</span
														>
														<select class="forge-select text-sm" bind:value={col.newValueType}>
															<option value="text">Text</option>
															<option value="paragraph">Paragraph</option>
															<option value="number">Number</option>
															<option value="boolean">Boolean</option>
															<option value="date">Date</option>
														</select>
													</label>
												</div>
											{/if}
										</div>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<form method="POST" action="?/import">
				<input type="hidden" name="tempFileId" value={form.tempFileId} />
				<input type="hidden" name="columnMappings" value={columnMappingsJson} />
				<button class="forge-button" type="submit" disabled={!canImport}>
					Import {form.totalRows} row{form.totalRows === 1 ? '' : 's'}
				</button>
			</form>
		</div>

	<!-- ── Step: upload ───────────────────────────────────────────────────── -->
	{:else}
		<div class="forge-panel space-y-5 p-6">
			{#if form?.message}
				<p
					class="rounded-2xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-900"
				>
					{form.message}
				</p>
			{/if}

			<div class="space-y-2">
				<p class="text-sm text-surface-700 dark:text-surface-300">
					CSV requirements:
				</p>
				<ul
					class="list-disc space-y-1 pl-5 text-sm text-surface-600 dark:text-surface-400"
				>
					<li>First row must be column headers</li>
					<li>Columns are mapped to character name and traits in the next step</li>
					<li>Quoted fields, commas in values, and multi-line cells are supported</li>
					<li>Maximum file size: 10 MB</li>
				</ul>
			</div>

			<form class="space-y-4" method="POST" action="?/upload" enctype="multipart/form-data">
				<label class="block space-y-2">
					<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
						>CSV file <span class="text-error-500">*</span></span
					>
					<input class="forge-input" type="file" name="file" accept=".csv,text/csv" required />
				</label>
				<button class="forge-button w-full" type="submit">Upload and map columns</button>
			</form>
		</div>
	{/if}
</section>

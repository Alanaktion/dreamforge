<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	type TraitValue = (typeof data.traitValues)[number];

	function groupByCategory(traits: TraitValue[]): [string, TraitValue[]][] {
		const map = new Map<string, TraitValue[]>();
		for (const trait of traits) {
			const cat = trait.category || '';
			if (!map.has(cat)) map.set(cat, []);
			map.get(cat)!.push(trait);
		}
		return [...map.entries()];
	}

	let traitsByCategory = $derived(groupByCategory(data.traitValues));
</script>

<section class="space-y-8">
	<div class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
		<div class="forge-panel p-8">
			<div class="flex flex-wrap items-center gap-3">
				<span class="forge-badge">{data.character.universeName}</span>
				<span class="text-sm text-surface-600"
					>Created {data.character.createdAt.toLocaleDateString()}</span
				>
			</div>

			<h2
				class="mt-4 text-4xl font-semibold tracking-tight text-surface-950 dark:text-surface-50"
			>
				{data.character.name}
			</h2>
			<p class="mt-4 max-w-3xl text-base leading-8 text-surface-700 dark:text-surface-300">
				{data.character.summary || 'No summary recorded yet.'}
			</p>

			<div class="markdown mt-8">{@html data.bioHtml}</div>
		</div>

		<aside class="space-y-5">
			<div class="forge-panel p-6">
				<h3 class="text-xl font-semibold text-surface-950 dark:text-surface-50">
					Trait profile
				</h3>
				{#if data.traitValues.length === 0}
					<p class="mt-3 text-sm text-surface-700 dark:text-surface-300">
						No traits defined for this universe.
					</p>
				{:else}
					<div class="mt-4 space-y-5">
						{#each traitsByCategory as [category, traits] (category)}
							<div class="space-y-3">
								{#if category}
									<h4
										class="text-xs font-semibold tracking-[0.18em] text-surface-500 uppercase"
									>
										{category}
									</h4>
								{/if}
								<ul class="space-y-2">
									{#each traits as trait (trait.id)}
										<li
											class="rounded-2xl border border-surface-200 bg-white/75 p-4 dark:border-surface-800 dark:bg-surface-900/70"
										>
											<p
												class="font-semibold text-surface-950 dark:text-surface-50"
											>
												{trait.label}
											</p>
											<p
												class="mt-2 text-sm text-surface-700 dark:text-surface-300"
											>
												{trait.value || 'Unset'}
											</p>
										</li>
									{/each}
								</ul>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="forge-panel p-6">
				<h3 class="text-xl font-semibold text-surface-950 dark:text-surface-50">
					Universe summary
				</h3>
				<p class="mt-3 text-sm leading-7 text-surface-700 dark:text-surface-300">
					{data.character.universeSummary || 'No universe summary has been written yet.'}
				</p>
			</div>
		</aside>
	</div>

	<div class="space-y-4">
		<div class="flex items-center justify-between gap-4">
			<div>
				<span class="forge-badge">Linked images</span>
				<h3 class="mt-3 text-2xl font-semibold text-surface-950 dark:text-surface-50">
					Character gallery
				</h3>
			</div>
			<a class="forge-button-ghost" href="/gallery">Open global gallery</a>
		</div>

		{#if data.linkedImages.length === 0}
			<div class="forge-panel p-8 text-center">
				<p class="text-surface-700 dark:text-surface-300">
					No images are linked to this character yet. Upload one from the gallery page and
					assign it to this profile.
				</p>
			</div>
		{:else}
			<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
				{#each data.linkedImages as image (image.id)}
					<figure class="forge-panel overflow-hidden p-3">
						<img
							class="aspect-[4/3] w-full rounded-[1.25rem] object-cover"
							src={`/media/${image.filename}`}
							alt={image.altText || image.originalFilename}
							loading="lazy"
						/>
						<figcaption
							class="px-2 pt-4 pb-2 text-sm text-surface-700 dark:text-surface-300"
						>
							<p class="font-semibold text-surface-900 dark:text-surface-100">
								{image.altText || image.originalFilename}
							</p>
							<p class="mt-1 text-xs tracking-[0.18em] text-surface-600 uppercase">
								{image.mimeType}
							</p>
						</figcaption>
					</figure>
				{/each}
			</div>
		{/if}
	</div>
</section>

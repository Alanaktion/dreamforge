<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { data }: PageProps = $props();
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
		<div>
			<h2
				class="mt-3 text-4xl font-semibold tracking-tight text-surface-950 dark:text-surface-50"
			>
				Your settings and trait schemas.
			</h2>
			<p class="mt-3 max-w-2xl text-base leading-7 text-surface-700 dark:text-surface-300">
				Each universe defines the trait schema shared by all characters in that setting.
				Edit traits here without touching individual character records.
			</p>
		</div>
		<a class="forge-button shrink-0" href={resolve('/universes/create')}>New universe</a>
	</div>

	<div class="forge-card-grid">
		{#each data.universes as universe (universe.id)}
			<article class="forge-panel flex h-full flex-col p-6">
				<div class="flex items-center justify-between gap-4">
					<span class="forge-badge"
						>{universe.characterCount} character{universe.characterCount === 1
							? ''
							: 's'}</span
					>
					<span class="text-xs tracking-[0.18em] text-surface-600 uppercase"
						>{universe.traitCount} trait{universe.traitCount === 1 ? '' : 's'}</span
					>
				</div>

				<div class="mt-5 flex-1 space-y-3">
					<h3 class="text-2xl font-semibold text-surface-950 dark:text-surface-50">
						{universe.name}
					</h3>
					<p
						class="line-clamp-4 text-sm leading-7 text-surface-700 dark:text-surface-300"
					>
						{universe.summary || 'No summary yet.'}
					</p>
				</div>

				<div class="mt-6 flex items-center justify-end gap-4">
					<a
						class="forge-link text-sm font-semibold"
						href={resolve(`/universes/${universe.id}`)}
					>
						Edit universe
					</a>
				</div>
			</article>
		{/each}
	</div>
</section>

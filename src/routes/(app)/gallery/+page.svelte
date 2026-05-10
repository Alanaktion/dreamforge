<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let isUploading = $state(false);
	let uploadMessage = $state('');
	let uploadError = $state('');

	async function handleUpload(event: SubmitEvent) {
		event.preventDefault();

		const form = event.currentTarget;

		if (!(form instanceof HTMLFormElement)) {
			return;
		}

		isUploading = true;
		uploadMessage = '';
		uploadError = '';

		const response = await fetch('/api/upload', {
			method: 'POST',
			body: new FormData(form)
		});

		const payload = (await response.json()) as { message?: string };

		if (!response.ok) {
			uploadError = payload.message ?? 'Upload failed.';
			isUploading = false;
			return;
		}

		form.reset();
		uploadMessage = 'Image uploaded successfully.';
		isUploading = false;
		await invalidateAll();
	}
</script>

<section class="space-y-8">
	<div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
		<form
			class="forge-panel space-y-5 p-8"
			enctype="multipart/form-data"
			onsubmit={handleUpload}
		>
			<div>
				<h2 class="mt-3 text-3xl font-semibold text-surface-950 dark:text-surface-50">
					Upload an image into your private gallery
				</h2>
			</div>

			<label class="block space-y-2">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
					>Image file</span
				>
				<input class="forge-input" type="file" name="file" accept="image/*" required />
			</label>

			<label class="block space-y-2">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
					>Alt text</span
				>
				<input
					class="forge-input"
					name="altText"
					placeholder="Portrait of Captain Ilyra Voss"
				/>
			</label>

			<label class="block space-y-2">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
					>Universe</span
				>
				<select class="forge-select" name="universeId">
					<option value="">Unassigned</option>
					{#each data.universes as universe (universe.id)}
						<option value={universe.id}>{universe.name}</option>
					{/each}
				</select>
			</label>

			<label class="block space-y-2">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
					>Link to character</span
				>
				<select class="forge-select" name="characterId">
					<option value="">Leave unlinked</option>
					{#each data.characters as character (character.id)}
						<option value={character.id}
							>{character.name} · {character.universeName}</option
						>
					{/each}
				</select>
			</label>

			{#if uploadError}
				<p
					class="rounded-2xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-900"
				>
					{uploadError}
				</p>
			{/if}

			{#if uploadMessage}
				<p
					class="rounded-2xl border border-success-300 bg-success-50 px-4 py-3 text-sm text-success-900"
				>
					{uploadMessage}
				</p>
			{/if}

			<button class="forge-button w-full" disabled={isUploading} type="submit">
				{isUploading ? 'Uploading…' : 'Upload image'}
			</button>
		</form>

		<div class="space-y-5">
			<div>
				<span class="forge-badge">Media library</span>
				<h3 class="mt-3 text-3xl font-semibold text-surface-950 dark:text-surface-50">
					Every upload served through a private media route
				</h3>
				<p
					class="mt-3 max-w-2xl text-base leading-7 text-surface-700 dark:text-surface-300"
				>
					Images are stored on disk under the configured data path and streamed back
					through `/media/[filename]` only after ownership is verified against your
					current session.
				</p>
			</div>

			<div class="grid gap-4 md:grid-cols-3">
				<div class="forge-stat">
					<p class="text-xs tracking-[0.18em] text-primary-700 uppercase">Images</p>
					<p class="mt-3 text-3xl font-semibold text-surface-950 dark:text-surface-50">
						{data.images.length}
					</p>
				</div>
				<div class="forge-stat">
					<p class="text-xs tracking-[0.18em] text-primary-700 uppercase">Characters</p>
					<p class="mt-3 text-3xl font-semibold text-surface-950 dark:text-surface-50">
						{data.characters.length}
					</p>
				</div>
				<div class="forge-stat">
					<p class="text-xs tracking-[0.18em] text-primary-700 uppercase">Universes</p>
					<p class="mt-3 text-3xl font-semibold text-surface-950 dark:text-surface-50">
						{data.universes.length}
					</p>
				</div>
			</div>
		</div>
	</div>

	{#if data.images.length === 0}
		<div class="forge-panel p-8 text-center">
			<p class="text-surface-700 dark:text-surface-300">
				Your gallery is empty. Upload an image to start building a private visual reference
				library.
			</p>
		</div>
	{:else}
		<div class="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
			{#each data.images as image (image.id)}
				<figure class="forge-panel overflow-hidden p-3">
					<img
						class="aspect-[4/3] w-full rounded-[1.25rem] object-cover"
						src={`/media/${image.filename}`}
						alt={image.altText || image.originalFilename}
						loading="lazy"
					/>
					<figcaption
						class="space-y-2 px-2 pt-4 pb-2 text-sm text-surface-700 dark:text-surface-300"
					>
						<p class="font-semibold text-surface-900 dark:text-surface-100">
							{image.altText || image.originalFilename}
						</p>
						<p class="text-xs tracking-[0.18em] text-surface-600 uppercase">
							{image.universeName ?? 'Unassigned'} · {image.mimeType}
						</p>
					</figcaption>
				</figure>
			{/each}
		</div>
	{/if}
</section>

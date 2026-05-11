<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';

	let { form }: PageProps = $props();
</script>

<div class="mx-auto grid max-w-7xl gap-10 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-14">
	<section class="space-y-6">
		<span class="forge-badge">Private by default</span>
		<div class="space-y-4">
			<h1
				class="max-w-2xl text-5xl font-semibold tracking-tight text-surface-950 dark:text-surface-50"
			>
				Forge characters, histories, and image archives that belong only to you.
			</h1>
			<p class="max-w-2xl text-lg leading-8 text-surface-700 dark:text-surface-300">
				DreamForge gives each account a private worldbuilding workspace with explicit
				universes, reusable trait definitions, markdown bios, and a local-media gallery.
			</p>
		</div>

		<div class="forge-card-grid">
			<article class="forge-stat">
				<h2 class="text-sm font-semibold tracking-[0.2em] text-primary-700 uppercase">
					Structured canon
				</h2>
				<p class="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-300">
					Define traits once at the universe level and reuse them across every character
					record in that world.
				</p>
			</article>
			<article class="forge-stat">
				<h2 class="text-sm font-semibold tracking-[0.2em] text-primary-700 uppercase">
					Local media
				</h2>
				<p class="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-300">
					Uploads are stored alongside your SQLite database under a shared data path for
					simple backups.
				</p>
			</article>
			<article class="forge-stat">
				<h2 class="text-sm font-semibold tracking-[0.2em] text-primary-700 uppercase">
					SSR-first
				</h2>
				<p class="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-300">
					Protected routes, media serving, and markdown rendering stay on the server where
					ownership checks are enforced.
				</p>
			</article>
		</div>
	</section>

	<section class="forge-panel p-8 lg:p-10">
		<div class="space-y-2">
			<p class="text-sm font-semibold tracking-[0.2em] text-primary-700 uppercase">Sign in</p>
			<h2 class="text-3xl font-semibold text-surface-950 dark:text-surface-50">
				Return to your worlds
			</h2>
		</div>

		<form class="mt-8 space-y-5" method="POST">
			<label class="block space-y-2">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Email</span
				>
				<input
					class="forge-input"
					type="email"
					name="email"
					value={form?.email ?? ''}
					required
				/>
			</label>

			<label class="block space-y-2">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200"
					>Password</span
				>
				<input class="forge-input" type="password" name="password" required />
			</label>

			<button class="forge-button w-full" type="submit">Sign in</button>
		</form>

		{#if form?.message}
			<p
				class="mt-4 rounded-2xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-900"
			>
				{form.message}
			</p>
		{/if}

		<p class="mt-6 text-sm text-surface-700 dark:text-surface-300">
			Need an account?
			<a class="forge-link" href={resolve('/register')}>Create one here</a>.
		</p>
	</section>
</div>

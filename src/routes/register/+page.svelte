<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<div class="mx-auto grid max-w-6xl gap-10 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10 lg:py-14">
	<section class="forge-panel p-8 lg:p-10">
		<div class="space-y-2">
			<p class="text-sm font-semibold uppercase tracking-[0.2em] text-primary-700">Register</p>
			<h1 class="text-3xl font-semibold text-surface-950 dark:text-surface-50">Start a private DreamForge workspace</h1>
		</div>

		<form class="mt-8 space-y-5" method="POST">
			<label class="block space-y-2">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Display name</span>
				<input class="forge-input" name="name" value={form?.name ?? ''} required />
			</label>

			<label class="block space-y-2">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Email</span>
				<input class="forge-input" type="email" name="email" value={form?.email ?? ''} required />
			</label>

			<label class="block space-y-2">
				<span class="text-sm font-medium text-surface-800 dark:text-surface-200">Password</span>
				<input class="forge-input" type="password" name="password" minlength="8" required />
			</label>

			<button class="forge-button w-full" type="submit">Create account</button>
		</form>

		{#if form?.message}
			<p class="mt-4 rounded-2xl border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-900">{form.message}</p>
		{/if}

		<p class="mt-6 text-sm text-surface-700 dark:text-surface-300">
			Already registered?
			<a class="forge-link" href="/login">Sign in</a>.
		</p>
	</section>

	<section class="space-y-6 pt-4">
		<span class="forge-badge">First-run flow</span>
		<h2 class="max-w-xl text-5xl font-semibold tracking-tight text-surface-950 dark:text-surface-200">Registration leads straight into universe setup, not an empty dashboard.</h2>
		<p class="max-w-2xl text-lg leading-8 text-surface-700 dark:text-surface-300">
			After signup you will create your first universe, define its reusable trait schema, and then move directly into character creation with that structure ready to go.
		</p>

		<div class="grid gap-5 md:grid-cols-3">
			<article class="forge-stat">
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-200">1. Create universe</h3>
				<p class="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-300">Name the setting, set its summary, and keep it private.</p>
			</article>
			<article class="forge-stat">
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-200">2. Define traits</h3>
				<p class="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-300">Establish keys like role, alignment, lineage, faction, or power source.</p>
			</article>
			<article class="forge-stat">
				<h3 class="text-base font-semibold text-surface-900 dark:text-surface-200">3. Populate characters</h3>
				<p class="mt-2 text-sm leading-6 text-surface-700 dark:text-surface-300">Write markdown bios, attach images, and keep every record scoped to your account.</p>
			</article>
		</div>
	</section>
</div>

<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import favicon from '$lib/assets/favicon.svg';

	let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>DreamForge</title>
	<meta
		name="description"
		content="Private worldbuilding workspace for universes, characters, traits, and galleries."
	/>
</svelte:head>

<div class="min-h-screen">
	{#if !data.user}
		<header class="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
			<a class="flex items-center gap-3 text-surface-950" href="/">
				<span class="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white">DF</span>
				<span>
					<span class="block text-xs uppercase tracking-[0.3em] text-primary-700">Worldbuilding Workspace</span>
					<span class="text-xl font-semibold">DreamForge</span>
				</span>
			</a>

			<nav class="flex items-center gap-3 text-sm font-medium">
				<a class="forge-button-ghost" href="/login">Sign in</a>
				<a class="forge-button" href="/register">Create account</a>
			</nav>
		</header>
	{/if}

	<main class:pb-12={!data.user} class:pt-2={!data.user} class:pb-10={data.user}>
		{@render children()}
	</main>

	{#if !data.user && page.url.pathname !== '/login' && page.url.pathname !== '/register'}
		<footer class="mx-auto max-w-7xl px-6 pb-10 text-sm text-surface-700 lg:px-10">
			DreamForge keeps every universe private by default, with local media storage and SSR-backed tools built for long-form creation.
		</footer>
	{/if}
</div>

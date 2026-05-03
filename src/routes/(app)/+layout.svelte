<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const navItems = [
		{ href: '/characters', label: 'Characters' },
		{ href: '/characters/create', label: 'Create' },
		{ href: '/gallery', label: 'Gallery' }
	];

	function isActive(href: string) {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<div class="mx-auto max-w-7xl px-6 py-6 lg:px-10 lg:py-8">
	<header class="forge-panel mb-8 overflow-hidden px-6 py-5 lg:px-8">
		<div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<span class="forge-badge">DreamForge</span>
					<span class="text-sm text-surface-700">{data.universeCount} universe{data.universeCount === 1 ? '' : 's'} in your private workspace</span>
				</div>
				<div>
					<h1 class="text-3xl font-semibold tracking-tight text-surface-950">Welcome back, {data.user.name}.</h1>
					<p class="mt-2 max-w-2xl text-sm leading-6 text-surface-700">Keep canon tidy with explicit universes, reusable traits, markdown bios, and images served from local storage.</p>
				</div>
			</div>

			<form action="/logout" method="POST">
				<button class="forge-button-ghost" type="submit">Sign out</button>
			</form>
		</div>

		<nav class="mt-6 flex flex-wrap gap-3">
			{#each navItems as item (item.href)}
				<a
					class={isActive(item.href)
						? 'forge-button'
						: 'forge-button-ghost'}
					href={item.href}
				>
					{item.label}
				</a>
			{/each}
		</nav>
	</header>

	{@render children()}
</div>

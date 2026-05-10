<script lang="ts">
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import Forge from '$lib/assets/forge.svelte';

	let { data, children }: LayoutProps = $props();

	const navItems = [
		{ href: '/universes', label: 'Universes' },
		{ href: '/characters', label: 'Characters' },
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
					<Forge class="size-5" />
					<span class="forge-badge hidden 2xl:block">DreamForge</span>
					<nav class="flex flex-wrap gap-3">
						{#each navItems as item (item.href)}
							<a
								class={isActive(item.href) ? 'forge-button' : 'forge-button-ghost'}
								href={item.href}
							>
								{item.label}
							</a>
						{/each}
					</nav>
				</div>
			</div>

			<form action="/logout" method="POST">
				<button class="forge-button-ghost" type="submit">Sign out</button>
			</form>
		</div>
	</header>

	{@render children()}
</div>

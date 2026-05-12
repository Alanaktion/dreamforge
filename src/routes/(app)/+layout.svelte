<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import type { LayoutProps } from './$types';
	import Forge from '$lib/assets/forge.svelte';

	let { children }: LayoutProps = $props();

	const navItems: { href: Pathname; label: string }[] = [
		{ href: '/universes', label: 'Universes' },
		{ href: '/characters', label: 'Characters' },
		{ href: '/gallery', label: 'Gallery' }
	];

	function isActive(href: Pathname) {
		return page.url.pathname === href || page.url.pathname.startsWith(`${href}/`);
	}
</script>

<div class="mx-auto px-6 py-6 lg:px-10 lg:py-8">
	<header class="forge-panel mb-8 overflow-hidden px-6 py-5">
		<div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
			<div class="space-y-3">
				<div class="flex items-center gap-3">
					<a
						class="flex items-center gap-3 text-surface-950 dark:text-surface-50"
						href={resolve('/')}
					>
						<span
							class="flex h-11 w-11 items-center justify-center rounded-full bg-primary-600 text-lg font-bold text-white"
						>
							<Forge class="size-5 fill-current" />
						</span>
						<span class="hidden text-xl font-semibold 2xl:block">DreamForge</span>
					</a>
					<nav class="flex flex-wrap gap-3">
						{#each navItems as item (item.href)}
							<a
								class={isActive(item.href) ? 'forge-button' : 'forge-button-ghost'}
								href={resolve(item.href)}
							>
								{item.label}
							</a>
						{/each}
					</nav>
				</div>
			</div>

			<form action={resolve('/logout')} method="POST">
				<button class="forge-button-ghost" type="submit">Sign out</button>
			</form>
		</div>
	</header>

	{@render children()}
</div>

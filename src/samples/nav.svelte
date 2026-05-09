<script lang="ts">
	import {
		ArrowLeftRightIcon,
		BikeIcon,
		BookIcon,
		HouseIcon,
		TreePalmIcon
	} from '@lucide/svelte';
	import { Navigation } from '@skeletonlabs/skeleton-svelte';

	const links = [
		{ label: 'Home', href: '/#', icon: HouseIcon },
		{ label: 'Entertainment', href: '/#', icon: BookIcon },
		{ label: 'Recreation', href: '/#', icon: BikeIcon },
		{ label: 'Relaxation', href: '/#', icon: TreePalmIcon }
	];

	let layoutRail = $state(true);
	function toggleLayout() {
		layoutRail = !layoutRail;
	}
</script>

<div class="grid h-182 w-full grid-cols-[auto_1fr] items-stretch border border-surface-200-800">
	<Navigation
		layout={layoutRail ? 'rail' : 'sidebar'}
		class={layoutRail ? '' : 'grid grid-rows-[1fr_auto] gap-4'}
	>
		<Navigation.Content>
			<Navigation.Header>
				<Navigation.Trigger onclick={toggleLayout}>
					<ArrowLeftRightIcon class={layoutRail ? 'size-5' : 'size-4'} />
					{#if !layoutRail}<span>Resize</span>{/if}
				</Navigation.Trigger>
			</Navigation.Header>
			<Navigation.Menu>
				{#each links as link (link)}
					{@const Icon = link.icon}
					<Navigation.TriggerAnchor>
						<Icon class={layoutRail ? 'size-5' : 'size-4'} />
						<Navigation.TriggerText>{link.label}</Navigation.TriggerText>
					</Navigation.TriggerAnchor>
				{/each}
			</Navigation.Menu>
		</Navigation.Content>
	</Navigation>

	<div class="flex items-center justify-center">
		<pre class="pre">Layout: {layoutRail ? 'Rail' : 'Sidebar'}</pre>
	</div>
</div>

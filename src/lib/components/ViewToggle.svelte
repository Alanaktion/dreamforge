<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

	let isTableView = $derived(page.url.pathname.startsWith('/characters/table'));
</script>

<div class="flex overflow-hidden rounded-full border border-surface-300 dark:border-surface-600">
	<a
		href={resolve('/characters')}
		class={!isTableView
			? 'forge-button rounded-none rounded-l-full border-0 shadow-none'
			: 'forge-button-ghost rounded-none rounded-l-full border-0 py-2'}
	>
		Cards
	</a>
	<a
		href={resolve('/characters/table')}
		class={isTableView
			? 'forge-button rounded-none rounded-r-full border-0 shadow-none'
			: 'forge-button-ghost rounded-none rounded-r-full border-0 py-2'}
	>
		Table
	</a>
</div>

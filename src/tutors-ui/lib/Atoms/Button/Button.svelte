<script>
  export let colour;
  export let href;
  export let size;
  export let target;
</script>

{#if href}
  <a class={["btn", `btn-${colour}`, `btn-${size}`].join(" ")} {href} {target}
    ><slot /></a
  >
{/if}
{#if !href}
  <button class={["btn", `btn-${colour}`, `btn-${size}`].join(" ")} on:click
    ><slot /></button
  >
{/if}

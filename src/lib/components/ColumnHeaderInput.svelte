<script lang="ts">
  let {
    value,
    onChange,
  }: { value: string; onChange: (label: string) => void } = $props();
</script>

<!--
  An editable table column header. It inherits the surrounding `<th>`'s
  type treatment (size, case, letter-spacing, alignment) so each table keeps
  styling its header row in one place.
-->
<input
  class="column-header-input"
  {value}
  oninput={(e) => onChange(e.currentTarget.value)}
/>

<style>
  .column-header-input {
    width: 100%;
    border: none;
    background: transparent;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    text-align: inherit;
    padding: 0;
  }
</style>

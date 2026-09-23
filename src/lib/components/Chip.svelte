<script lang="ts">
    let { label }: { label: string } = $props()
</script>

<span class="chip">{label}</span>

<style>
    .chip {
        display: inline-flex;
        align-items: center;
        height: 24px;
        padding: 0 8px;
        border: 1px solid rgb(var(--c-neon) / 0.3);
        border-radius: 12px;
        background: rgb(var(--c-neon) / 0.1);
        color: rgb(var(--c-neon-soft));
        font-family: var(--font-body);
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.04em;
        white-space: nowrap;
        vertical-align: middle;
    }
</style>

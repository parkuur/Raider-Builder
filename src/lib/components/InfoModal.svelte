<script lang="ts">
  import Modal from "./Modal.svelte";

  const REPO_URL = "https://github.com/parkuur/Raider-Builder";

  let { open, onClose }: { open: boolean; onClose: () => void } = $props();
</script>

<Modal {open} title="About this app" {onClose}>
  <div class="info-modal__body">
    <p>
      This is a free service provided by Frosty Sound — use it to put together
      and edit your band's technical rider, no account needed.
    </p>
    <p>
      The application runs entirely in your browser. Once the page has loaded,
      no data is sent to a server — everything you enter lives exclusively on
      your own device.
    </p>
    <p>
      The source code is on GitHub: <a
        href={REPO_URL}
        target="_blank"
        rel="noopener noreferrer">{REPO_URL}</a
      >
    </p>
    <p>
      Frosty Sound is a small, one-person sound tech company based in Helsinki,
      Finland, providing affordable and friendly sound services for bands and
      artists.
    </p>
  </div>
  <div class="info-modal__footer">
    <button type="button" class="info-modal__close" onclick={onClose}
      >Close</button
    >
  </div>
</Modal>

<style>
  .info-modal__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    font-size: var(--font-size-body);
    color: var(--color-text);
  }

  .info-modal__body a {
    color: var(--color-accent);
  }

  .info-modal__footer {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--space-4);
  }

  .info-modal__close {
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-label);
  }
</style>

<script lang="ts">
  import { getDocument, setHeaderField } from "../state/document.svelte";
</script>

<header class="document-header">
  <a
    class="document-header__logo no-print"
    href="https://frostysound.fi"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Frosty Sound"
  >
    <img src="/fs-logo.jpg" alt="Frosty Sound" />
  </a>
  <div class="document-header__fields">
    <input
      class="document-header__title"
      value={getDocument().header.title}
      oninput={(e) => setHeaderField("title", e.currentTarget.value)}
      placeholder="Technical Rider"
    />
    <input
      class="document-header__band"
      value={getDocument().header.band}
      oninput={(e) => setHeaderField("band", e.currentTarget.value)}
      placeholder="Band / Act Name"
    />
    <div class="document-header__meta">
      <label class="document-header__meta-field">
        <span class="document-header__meta-label">Rev</span>
        <input
          class="document-header__meta-input"
          value={getDocument().header.revision}
          oninput={(e) => setHeaderField("revision", e.currentTarget.value)}
        />
      </label>
      <label class="document-header__meta-field">
        <span class="document-header__meta-label">Date</span>
        <input
          class="document-header__meta-input"
          type="date"
          value={getDocument().header.date}
          oninput={(e) => setHeaderField("date", e.currentTarget.value)}
        />
      </label>
    </div>
  </div>
</header>

<style>
  .document-header {
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
    margin-bottom: var(--space-5);
  }

  .document-header__logo {
    flex: none;
    display: block;
  }

  .document-header__logo img {
    display: block;
    height: 40px;
    width: auto;
    object-fit: contain;
  }

  .document-header__fields {
    flex: 1;
    min-width: 0;
  }

  .document-header__title,
  .document-header__band,
  .document-header__meta-input {
    border: none;
    background: transparent;
    color: var(--color-text);
    padding: 0;
  }

  .document-header__title {
    display: block;
    width: 100%;
    font-family: var(--font-heading);
    font-weight: 600;
    font-size: var(--font-size-doc-title);
    margin-bottom: var(--space-1);
  }

  .document-header__band {
    display: block;
    width: 100%;
    font-size: var(--font-size-body);
    color: var(--color-accent);
    margin-bottom: var(--space-2);
  }

  .document-header__meta {
    display: flex;
    gap: var(--space-5);
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-2);
  }

  .document-header__meta-field {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
  }

  .document-header__meta-label {
    font-size: var(--font-size-label);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }

  .document-header__meta-input {
    font-size: var(--font-size-body);
    width: 70px;
  }
</style>

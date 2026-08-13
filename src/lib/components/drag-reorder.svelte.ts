export class DragReorderState {
  #draggingId = $state<string | null>(null);
  #overId = $state<string | null>(null);

  get draggingId(): string | null {
    return this.#draggingId;
  }

  isDragging(id: string): boolean {
    return this.#draggingId === id;
  }

  isOver(id: string): boolean {
    return this.#overId === id && id !== this.#draggingId;
  }

  start(id: string): void {
    this.#draggingId = id;
  }

  over(id: string): void {
    if (this.#draggingId && id !== this.#draggingId) this.#overId = id;
  }

  end(): void {
    this.#draggingId = null;
    this.#overId = null;
  }

  /**
   * Resolves the (fromIndex, toIndex) pair for a drop on `targetId`, given the
   * list's current id order. Returns null for any no-op case (nothing being
   * dragged, dropped on itself, or a stale/unknown id) and always clears drag
   * state as a side effect.
   */
  resolveDrop(
    ids: readonly string[],
    targetId: string,
  ): [number, number] | null {
    const from = this.#draggingId;
    this.end();
    if (!from || from === targetId) return null;
    const fromIndex = ids.indexOf(from);
    const toIndex = ids.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return null;
    return [fromIndex, toIndex];
  }
}

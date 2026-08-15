// 应用状态管理：设置 + 文件项集合，提供订阅通知

export function createStore(initialSettings) {
  const state = {
    settings: { ...initialSettings },
    items: new Map(), // id -> { id, file, status, result, error }
    nextId: 1,
  };
  const listeners = new Set();

  function emit() {
    for (const listener of listeners) listener(state);
  }

  return {
    getState() {
      return state;
    },

    getSettings() {
      return state.settings;
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setSettings(patch) {
      state.settings = { ...state.settings, ...patch };
      emit();
    },

    addFiles(files) {
      const added = [];
      for (const file of files) {
        const id = state.nextId;
        state.nextId += 1;
        state.items.set(id, { id, file, status: 'idle', result: null, error: null });
        added.push(id);
      }
      emit();
      return added;
    },

    setItemStatus(id, status) {
      const item = state.items.get(id);
      if (!item) return;
      item.status = status;
      emit();
    },

    setItemResult(id, result) {
      const item = state.items.get(id);
      if (!item) return;
      item.result = result;
      item.error = null;
      item.status = 'done';
      emit();
    },

    setItemError(id, error) {
      const item = state.items.get(id);
      if (!item) return;
      item.error = error;
      item.result = null;
      item.status = 'error';
      emit();
    },

    removeItem(id) {
      state.items.delete(id);
      emit();
    },

    resetResults() {
      for (const item of state.items.values()) {
        item.status = 'idle';
        item.result = null;
        item.error = null;
      }
      emit();
    },

    clear() {
      state.items.clear();
      emit();
    },
  };
}

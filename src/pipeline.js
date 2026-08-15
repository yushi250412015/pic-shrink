// 任务调度：维护 Worker 池与待处理队列，把结果写回 store

export class Pipeline {
  constructor(store, { concurrency = Math.min(4, navigator.hardwareConcurrency || 2), onIdle = () => {} } = {}) {
    this.store = store;
    this.concurrency = concurrency;
    this.onIdle = onIdle;
    this.workers = [];
    this.queue = [];
    this.running = 0;
  }

  #ensureWorkers() {
    if (this.workers.length) return;
    for (let i = 0; i < this.concurrency; i += 1) {
      const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
      worker.busy = false;
      worker.onmessage = (event) => {
        worker.busy = false;
        this.running -= 1;
        this.#handleResult(event.data);
        this.#pump();
      };
      worker.onerror = () => {
        worker.busy = false;
        this.running -= 1;
        this.#pump();
      };
      this.workers.push(worker);
    }
  }

  #handleResult(data) {
    const item = this.store.getState().items.get(data.id);
    if (!item || item.rev !== data.rev) return; // 过期结果，忽略
    if (data.ok) {
      this.store.setItemResult(data.id, {
        blob: data.blob,
        width: data.width,
        height: data.height,
        format: data.format,
        originalWidth: data.originalWidth,
        originalHeight: data.originalHeight,
        quality: data.quality,
      });
    } else {
      this.store.setItemError(data.id, data.error || '处理失败');
    }
  }

  #pump() {
    while (this.queue.length > 0) {
      const worker = this.workers.find((w) => !w.busy);
      if (!worker) return;
      const job = this.queue.shift();
      if (!this.store.getState().items.has(job.id)) continue;
      worker.busy = true;
      this.running += 1;
      this.store.setItemStatus(job.id, 'processing');
      worker.postMessage(job);
    }
    if (this.running === 0) this.onIdle();
  }

  run() {
    this.#ensureWorkers();
    const { items, settings } = this.store.getState();
    this.queue = [];
    for (const item of items.values()) {
      this.queue.push({
        id: item.id,
        file: item.file,
        settings: { ...settings },
        crop: item.crop || null,
        rev: item.rev,
      });
      this.store.setItemStatus(item.id, 'queued');
    }
    this.#pump();
  }

  rerunItem(id) {
    this.#ensureWorkers();
    const item = this.store.getState().items.get(id);
    if (!item) return;
    this.store.resetItem(id);
    this.queue.push({
      id: item.id,
      file: item.file,
      settings: { ...this.store.getState().settings },
      crop: item.crop || null,
      rev: item.rev,
    });
    this.#pump();
  }

  rerun() {
    this.store.resetResults();
    this.run();
  }
}

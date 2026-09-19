/* ============================================================
   db.js — IndexedDB 封装（收藏 / 历史 / 偏好）
   store 设计：
     favorites : key = 菜谱 id，value = { id, at }
     history   : 单条记录 key='items'，value = [{ id, at }, ...]
     prefs     : 单条记录 key='main'，value = { prefs, avoid, serve, goal, filter }
   容错：IndexedDB 打不开时降级 localStorage，再不行降级内存对象。
   ============================================================ */
(function () {
  'use strict';

  const DB_NAME = 'chishenme';
  const DB_VERSION = 1;
  const STORES = ['favorites', 'history', 'prefs'];
  const LS_PREFIX = 'chishenme.v2.';

  /* ---------- localStorage / 内存降级实现 ---------- */
  function makeFallback() {
    const mem = {};
    const read = k => {
      try { return localStorage.getItem(LS_PREFIX + k); } catch (e) { return mem[k] || null; }
    };
    const write = (k, v) => {
      try { localStorage.setItem(LS_PREFIX + k, v); } catch (e) { mem[k] = v; }
    };
    return {
      mode: 'localstorage',
      get(store, key) {
        const raw = read(store + '::' + key);
        return Promise.resolve(raw == null ? undefined : JSON.parse(raw));
      },
      set(store, key, val) { write(store + '::' + key, JSON.stringify(val)); return Promise.resolve(); },
      del(store, key) { write(store + '::' + key, ''); return Promise.resolve(); },
      keys(store) {
        const out = [];
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.indexOf(LS_PREFIX + store + '::') === 0) out.push(k.split('::')[1]);
          }
        } catch (e) {}
        return Promise.resolve(out);
      }
    };
  }

  /* ---------- IndexedDB 实现 ---------- */
  function makeIDB() {
    let dbp = null;
    function open() {
      if (dbp) return dbp;
      dbp = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = e => {
          const db = e.target.result;
          STORES.forEach(s => { if (!db.objectStoreNames.contains(s)) db.createObjectStore(s); });
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        /* 阻塞升级等极端情况按失败处理 */
        req.onblocked = () => reject(new Error('idb blocked'));
      });
      return dbp;
    }
    function tx(store, mode, fn) {
      return open().then(db => new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const os = t.objectStore(store);
        const out = fn(os);
        t.oncomplete = () => resolve(out && 'result' in out ? out.result : undefined);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error || new Error('idb abort'));
      }));
    }
    return {
      mode: 'indexeddb',
      get(store, key) {
        return tx(store, 'readonly', os => os.get(key)).then(r => r, () => undefined);
      },
      set(store, key, val) { return tx(store, 'readwrite', os => os.put(val, key)); },
      del(store, key) { return tx(store, 'readwrite', os => os.delete(key)); },
      keys(store) {
        return tx(store, 'readonly', os => os.getAllKeys())
          .then(r => r || [], () => []);
      }
    };
  }

  let impl;
  try { impl = (window.indexedDB) ? makeIDB() : makeFallback(); }
  catch (e) { impl = makeFallback(); }

  /* 统一 API：首次调用探测 IndexedDB 是否真的可用（含隐私模式） */
  const api = {
    mode: impl.mode,
    _ready: null,
    ready() {
      if (this._ready) return this._ready;
      this._ready = impl.set('__probe', 'ok', { at: Date.now() })
        .then(() => true)
        .catch(() => { impl = makeFallback(); this.mode = 'localstorage'; return false; });
      return this._ready;
    },
    get(store, key) { return impl.get(store, key); },
    set(store, key, val) { return impl.set(store, key, val); },
    del(store, key) { return impl.del(store, key); },
    keys(store) { return impl.keys(store); },

    /* 便捷方法 */
    favList() {
      return this.keys('favorites').then(keys =>
        Promise.all(keys.map(k => this.get('favorites', k)))
          .then(vals => vals.filter(Boolean).sort((a, b) => b.at - a.at))
      );
    },
    toggleFav(id) {
      return this.get('favorites', id).then(v => {
        if (v) { return this.del('favorites', id).then(() => false); }
        return this.set('favorites', id, { id, at: Date.now() }).then(() => true);
      });
    },
    historyGet() { return this.get('history', 'items').then(v => (Array.isArray(v) ? v : [])); },
    historyPush(id) {
      return this.historyGet().then(list => {
        const last = list[list.length - 1];
        if (last && last.id === id) return list;
        list.push({ id, at: Date.now() });
        if (list.length > 500) list = list.slice(-500);
        return this.set('history', 'items', list).then(() => list);
      });
    },
    historySet(list) { return this.set('history', 'items', list); },
    prefsGet() { return this.get('prefs', 'main').then(v => v || null); },
    prefsSet(obj) { return this.set('prefs', 'main', obj); }
  };

  window.DB = api;
})();

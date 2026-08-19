import fs from 'node:fs';
import path from 'node:path';

export class HookManager {
  static beforeCreateHooks = new Map();
  static afterCreateHooks = new Map();
  static beforeUpdateHooks = new Map();
  static afterUpdateHooks = new Map();
  static beforeDeleteHooks = new Map();
  static afterDeleteHooks = new Map();

  static onBeforeCreate(collection, handler) {
    const list = this.beforeCreateHooks.get(collection) || [];
    list.push(handler);
    this.beforeCreateHooks.set(collection, list);
  }

  static onAfterCreate(collection, handler) {
    const list = this.afterCreateHooks.get(collection) || [];
    list.push(handler);
    this.afterCreateHooks.set(collection, list);
  }

  static onBeforeUpdate(collection, handler) {
    const list = this.beforeUpdateHooks.get(collection) || [];
    list.push(handler);
    this.beforeUpdateHooks.set(collection, list);
  }

  static onAfterUpdate(collection, handler) {
    const list = this.afterUpdateHooks.get(collection) || [];
    list.push(handler);
    this.afterUpdateHooks.set(collection, list);
  }

  static onBeforeDelete(collection, handler) {
    const list = this.beforeDeleteHooks.get(collection) || [];
    list.push(handler);
    this.beforeDeleteHooks.set(collection, list);
  }

  static onAfterDelete(collection, handler) {
    const list = this.afterDeleteHooks.get(collection) || [];
    list.push(handler);
    this.afterDeleteHooks.set(collection, list);
  }

  static async triggerBeforeCreate(context) {
    await this.runHooks(this.beforeCreateHooks, context);
  }

  static async triggerAfterCreate(context) {
    await this.runHooks(this.afterCreateHooks, context);
  }

  static async triggerBeforeUpdate(context) {
    await this.runHooks(this.beforeUpdateHooks, context);
  }

  static async triggerAfterUpdate(context) {
    await this.runHooks(this.afterUpdateHooks, context);
  }

  static async triggerBeforeDelete(context) {
    await this.runHooks(this.beforeDeleteHooks, context);
  }

  static async triggerAfterDelete(context) {
    await this.runHooks(this.afterDeleteHooks, context);
  }

  static async runHooks(map, context) {
    const colName = context.collection.name;
    const handlers = [
      ...(map.get('*') || []),
      ...(map.get(colName) || []),
    ];

    for (const handler of handlers) {
      await handler(context);
    }
  }

  static async loadUserHooks(hooksDir = './minibase_hooks') {
    const resolvedPath = path.resolve(hooksDir);
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true });
      return;
    }

    const files = fs.readdirSync(resolvedPath).filter(f => f.endsWith('.js') || f.endsWith('.mjs'));
    for (const file of files) {
      const fullPath = path.join(resolvedPath, file);
      try {
        const mod = await import(`file://${fullPath}`);
        if (typeof mod.default === 'function') {
          mod.default(HookManager);
        }
      } catch (err) {
        console.error(`[Hooks] Failed to load hook file "${file}":`, err);
      }
    }
  }
}

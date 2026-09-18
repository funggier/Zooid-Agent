import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  emptyProviderCatalog,
  type ProviderCatalog,
  validateProviderCatalog,
} from "./provider-catalog.ts";

export class ProviderCatalogCorruptError extends Error {
  readonly filePath: string;

  constructor(filePath: string, cause?: unknown) {
    super(
      `Provider catalog is corrupt and was preserved: ${filePath}`,
      cause === undefined ? undefined : { cause },
    );
    this.name = "ProviderCatalogCorruptError";
    this.filePath = filePath;
  }
}

export class FileProviderCatalogStore {
  readonly root: string;
  readonly providersDir: string;
  readonly catalogPath: string;

  constructor(root = process.env.ZOOID_DATA_DIR ?? ".zooid-data") {
    this.root = resolve(root);
    this.providersDir = join(this.root, "providers");
    this.catalogPath = join(this.providersDir, "catalog.json");
  }

  async ensureDirectory(): Promise<void> {
    await mkdir(this.providersDir, { recursive: true });
  }

  async load(): Promise<ProviderCatalog> {
    let raw: string;

    try {
      raw = await readFile(this.catalogPath, "utf8");
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return emptyProviderCatalog();
      }
      throw error;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      validateProviderCatalog(parsed);
      return cloneCatalog(parsed);
    } catch (error) {
      if (error instanceof ProviderCatalogCorruptError) {
        throw error;
      }
      throw new ProviderCatalogCorruptError(this.catalogPath, error);
    }
  }

  async save(catalog: ProviderCatalog): Promise<void> {
    validateProviderCatalog(catalog);
    await this.ensureDirectory();

    const tempPath = join(
      this.providersDir,
      `.catalog.json.tmp-${process.pid}-${randomUUID()}`,
    );

    try {
      await writeFile(
        tempPath,
        `${JSON.stringify(catalog, null, 2)}\n`,
        "utf8",
      );
      await rename(tempPath, this.catalogPath);
    } finally {
      await rm(tempPath, { force: true }).catch(() => undefined);
    }
  }
}

function cloneCatalog(catalog: ProviderCatalog): ProviderCatalog {
  return structuredClone(catalog);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

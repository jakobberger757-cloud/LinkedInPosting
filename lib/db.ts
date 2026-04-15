import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { AngleRecord, DraftRecord, FeedbackRecord, HistoryItem, SourceRecord } from "@/lib/types";

type Store = {
  sources: SourceRecord[];
  angles: AngleRecord[];
  drafts: DraftRecord[];
  feedback: FeedbackRecord[];
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "app-data.json");

const emptyStore: Store = { sources: [], angles: [], drafts: [], feedback: [] };

async function ensureStore() {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(emptyStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<Store> {
  await ensureStore();
  const raw = await fs.readFile(dataFile, "utf8");
  return JSON.parse(raw) as Store;
}

async function writeStore(store: Store) {
  await ensureStore();
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}

export async function insertSource(input: Omit<SourceRecord, "id" | "createdAt">) {
  const store = await readStore();
  const record: SourceRecord = { id: randomUUID(), createdAt: new Date().toISOString(), ...input };
  store.sources.unshift(record);
  await writeStore(store);
  return record;
}

export async function insertAngles(sourceId: string, angles: Array<Omit<AngleRecord, "id" | "sourceId" | "createdAt">>) {
  const store = await readStore();
  const records = angles.map((angle) => ({ id: randomUUID(), sourceId, createdAt: new Date().toISOString(), ...angle }));
  store.angles.unshift(...records);
  await writeStore(store);
  return records;
}

export async function insertDrafts(angleId: string, drafts: Array<Omit<DraftRecord, "id" | "angleId" | "createdAt">>) {
  const store = await readStore();
  const records = drafts.map((draft) => ({ id: randomUUID(), angleId, createdAt: new Date().toISOString(), ...draft }));
  store.drafts.unshift(...records);
  await writeStore(store);
  return records;
}

export async function insertFeedback(draftId: string, vote: "up" | "down") {
  const store = await readStore();
  const record: FeedbackRecord = { id: randomUUID(), draftId, vote, createdAt: new Date().toISOString() };
  store.feedback.unshift(record);
  await writeStore(store);
  return record;
}

export async function getSourceById(sourceId: string) {
  const store = await readStore();
  return store.sources.find((source) => source.id === sourceId) ?? null;
}

export async function getAngleById(angleId: string) {
  const store = await readStore();
  return store.angles.find((angle) => angle.id === angleId) ?? null;
}

export async function listHistory(limit = 10): Promise<HistoryItem[]> {
  const store = await readStore();
  return store.sources.slice(0, limit).map((source) => {
    const angles = store.angles
      .filter((angle) => angle.sourceId === source.id)
      .map((angle) => ({
        ...angle,
        drafts: store.drafts.filter((draft) => draft.angleId === angle.id)
      }));

    return { source, angles };
  });
}

export async function recentDraftTexts(limit = 12) {
  const store = await readStore();
  return store.drafts.slice(0, limit).map((draft) => draft.text);
}

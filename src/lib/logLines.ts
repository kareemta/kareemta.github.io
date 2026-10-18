/**
 * Lines for the background log stream (<LogStream>). Client-safe: no content
 * loading here. Content lines are built on the server by getContentLogLines()
 * in content.ts and passed in as props; infra lines are generated here.
 *
 * Infra lines are deliberately generic (Kafka-style vocabulary only) and must
 * never name a real employer system.
 */
export type LogLine = { topic: string; message: string };

const pick = <T,>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
const int = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

const GROUPS = ["site-feed", "events-consumer", "indexer", "notifier"] as const;
const TOPICS = ["events", "reviews", "travel", "feed"] as const;

const INFRA: (() => LogLine)[] = [
  () => ({ topic: "consumer.lag", message: `group=${pick(GROUPS)} partition=${int(0, 11)} lag=${int(0, 40)}` }),
  () => ({ topic: "partition.rebalance", message: `group=${pick(GROUPS)} assigned=${int(2, 12)} gen=${int(10, 400)}` }),
  () => ({ topic: "checkpoint.committed", message: `topic=${pick(TOPICS)} offset=${int(1000, 99999)}` }),
  () => ({ topic: "batch.flushed", message: `records=${int(16, 1024)} bytes=${int(4, 512)}KiB` }),
  () => ({ topic: "watermark.advanced", message: `topic=${pick(TOPICS)} delay=${int(1, 900)}ms` }),
  () => ({ topic: "segment.rolled", message: `topic=${pick(TOPICS)} partition=${int(0, 11)}` }),
  () => ({ topic: "schema.validated", message: `topic=${pick(TOPICS)} version=${int(1, 9)} ok` }),
  () => ({ topic: "heartbeat", message: `group=${pick(GROUPS)} status=ok` }),
  () => ({ topic: "producer.ack", message: `topic=${pick(TOPICS)} acks=all latency=${int(2, 40)}ms` }),
];

export function randomInfraLine(): LogLine {
  return pick(INFRA)();
}

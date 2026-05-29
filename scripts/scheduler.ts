import { runDailyPipeline } from "@/lib/news/pipeline";
import { appConfig } from "@/lib/settings";
import { formatDateKey } from "@/lib/news/text";

let lastRunKey = "";
let running = false;

async function tick() {
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: appConfig.timezone,
      hour: "2-digit",
      hour12: false
    }).format(now)
  );
  const minute = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: appConfig.timezone,
      minute: "2-digit"
    }).format(now)
  );
  const dateKey = formatDateKey(now, appConfig.timezone);

  if (running || lastRunKey === dateKey || hour !== appConfig.defaultBriefHour || minute !== 0) {
    return;
  }

  running = true;
  try {
    const result = await runDailyPipeline(now);
    lastRunKey = dateKey;
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    running = false;
  }
}

console.log(
  `Scheduler started. It will run daily at ${appConfig.defaultBriefHour}:00 ${appConfig.timezone}.`
);

process.on("SIGINT", () => {
  process.exit(0);
});

void tick();
setInterval(() => void tick(), 60 * 1000);

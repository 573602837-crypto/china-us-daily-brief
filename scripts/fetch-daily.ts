import { runDailyPipeline } from "@/lib/news/pipeline";

async function main() {
  const result = await runDailyPipeline();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

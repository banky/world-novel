import { Input } from "./components/input";
import { Prompt } from "./components/prompt";
import { Story } from "./components/story";

export default function Home() {
  return (
    <>
      {/* <Head></Head> */}

      <main className="max-w-3xl mx-auto h-full flex flex-col gap-8">
        <Prompt />
        <div className="flex-1 basis-0 min-h-0">
          <Story />
        </div>
        <Input />
      </main>
    </>
  );
}

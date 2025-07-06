import { HydrateClient } from "~/trpc/server";
import CardErc7730 from "./address-abi-form";
import { ModeToggle } from "~/components/ui/theme-switcher";
import { Ledger } from "~/icons/ledger";

export default async function Home() {
  return (
    <HydrateClient>
      <div className="container m-auto flex h-screen max-w-2xl items-center justify-center p-4">
        <div>
          <h1 className="mb-6 flex items-center justify-center text-2xl font-bold relative">
            <div className="rounded bg-black/5 p-4 mr-4">
              <Ledger size={24} className="stroke-white stroke-1" />
            </div>
            <span className="flex items-center">
              ERC7730 JSON builder
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full transform rotate-45 -ml-3 -mt-4">
                Alpha
              </span>
            </span>
            <div className="absolute right-0">
              <ModeToggle />
            </div>
          </h1>

          <CardErc7730 />
        </div>
      </div>
    </HydrateClient>
  );
}

import { HydrateClient } from "~/trpc/server";
import { BreadcrumbInfo } from "./breadCrumb";
import OperationCarousel from "./operationCarousel";
import BackToEdit from "./backToEdit";
import ReviewJson from "./reviewJson";
import SelectValidOperation from "./selectValidOperation";
import OperationNotValidated from "./operationNotValidated";
import { Ledger } from "~/icons/ledger";

export default async function Home() {
  return (
    <HydrateClient>
      <div className="container mx-auto flex max-w-2xl flex-col justify-center p-4 lg:min-w-[1000px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded bg-black/5 p-4">
              <Ledger size={24} className="stroke-white stroke-1" />
            </div>
            <h1 className="text-2xl font-bold">Review Operations</h1>
          </div>
          <div className="flew-row flex justify-between">
            <BreadcrumbInfo />

            <div className="flex items-center gap-4">
              <OperationNotValidated />
              <BackToEdit />
              <ReviewJson />
            </div>
          </div>

          <div className="mx-auto py-4">
            <SelectValidOperation />
          </div>
          <OperationCarousel />
        </div>
      </div>
    </HydrateClient>
  );
}

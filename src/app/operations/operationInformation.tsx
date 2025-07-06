import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { type UseFormReturn } from "react-hook-form";
import { type OperationFormType } from "./editOperation";
import { Device } from "~/components/devices/device";
import { TitleScreen } from "~/components/devices/titleScreen";
import { Card } from "~/components/ui/card";
import { type OperationMetadata } from "~/store/types";
import { Button } from "~/components/ui/button";

interface Props {
  form: UseFormReturn<OperationFormType>;
  operationMetadata: OperationMetadata | null;
  onContinue: () => void;
}

const OperationInformation = ({ form, onContinue }: Props) => {
  const { intent } = form.watch();

  return (
    <div className="grid grid-cols-1 gap-6 min-[1000px]:grid-cols-2">
      <div>
        <Card className="h-fit p-6">
          <FormField
            control={form.control}
            name="intent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Operation name</FormLabel>
                <FormControl>
                  <Input placeholder="intent" {...field} />
                </FormControl>
                <FormDescription>
                  This is the name of the transaction Operation.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Card>
        <Button onClick={onContinue} className="mt-10">
          Continue
        </Button>
      </div>
      <div className="hidden justify-center min-[1000px]:flex">
        <Device.Frame size="normal">
          <div className="flex h-full w-full flex-col justify-between text-black antialiased">
            <div className="overflow-hidden break-words px-2 pt-16">
              <TitleScreen
                functionName={intent ?? "{functionName}"}
                type={"transaction"}
              />
            </div>
            <div className="hidden justify-center md:flex">
              <Device.Pagination current={1} total={1} />
            </div>
          </div>
        </Device.Frame>
      </div>
    </div>
  );
};

export default OperationInformation;

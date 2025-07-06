import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useErc7730Store } from "~/store/erc7730Provider";
import { z } from "zod";
import { Form } from "~/components/ui/form";
import OperationInformation from "./operationInformation";
import { DateFieldFormSchema } from "./fields/dateFieldForm";
import { Fragment, useEffect, useState } from "react";
import { TokenAmountFieldFormSchema } from "./fields/tokenAmountFormField";
import { NftNameParametersFormSchema } from "./fields/nftNameFieldForm";
import { AddressNameParametersFormSchema } from "./fields/addressNameFieldForm";
import { UnitParametersFormSchema } from "./fields/unitFieldForm";
import { convertOperationToSchema } from "~/lib/convertOperationToSchema";
import { updateOperationFromSchema } from "~/lib/updateOperationFromSchema";
import { removeExcludedFields } from "~/lib/removeExcludedFields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import FieldForm from "./fieldForm";
import useOperationStore from "~/store/useOperationStore";
import { Slash } from "lucide-react";
import { SidebarSeparator } from "~/components/ui/sidebar";
import { Button } from "~/components/ui/button";

const FieldParams = z.union([
  DateFieldFormSchema,
  TokenAmountFieldFormSchema,
  NftNameParametersFormSchema,
  AddressNameParametersFormSchema,
  UnitParametersFormSchema,
  z.null(),
  z.object({}).strict(),
]);

export type ParamsType = z.infer<typeof FieldParams>;

const OperationFormSchema = z.object({
  intent: z.string().min(1, {
    message: "Please enter the intent of the operation.",
  }),
  fields: z.array(
    z.object({
      label: z.string(),
      format: z.union([
        z.enum([
          "raw",
          "addressName",
          "calldata",
          "amount",
          "tokenAmount",
          "nftName",
          "date",
          "duration",
          "unit",
          "enum",
        ]),
        z.null(),
        z.undefined(),
      ]),
      params: FieldParams,
      path: z.string(),
      isRequired: z.boolean(),
      isIncluded: z.boolean(),
    }),
  ),
});

export type OperationFormType = z.infer<typeof OperationFormSchema>;

interface Props {
  selectedOperation: string;
}
const EditOperation = ({ selectedOperation }: Props) => {
  const operationToEdit = useErc7730Store((s) => s.getOperationsByName)(
    selectedOperation,
  );

  const operationMetadata = useErc7730Store((s) => s.getOperationsMetadata)(
    selectedOperation,
  );

  const setOperationData = useErc7730Store((s) => s.setOperationData);
  const saveOperationData = useErc7730Store((s) => s.saveOperationData);

  const setUpdatedOperation = useOperationStore(
    (state) => state.setUpdatedOperation,
  );

  const generatedErc7730 = useErc7730Store((s) => s.generatedErc7730);

  const form = useForm<OperationFormType>({
    resolver: zodResolver(OperationFormSchema),
    mode: "onChange",
    defaultValues: {
      intent: "",
      fields: [],
    },
  });

  const { watch } = form;

  const formSteps = watch("fields").map((field) => field.path);
  const [step, setStep] = useState("intent");
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorAI, setErrorAI] = useState<string | null>(null);

  const operations = useErc7730Store((s) => s.generatedErc7730?.display?.formats ?? {});

  useEffect(() => {
    if (!operationToEdit) return;
    console.log("operationToEdit", operationToEdit);
    const defaultValues = convertOperationToSchema(operationToEdit);

    console.log("defaultValues", defaultValues);
    form.reset(defaultValues);
  }, [operationToEdit, form]);

  useEffect(() => {
    setStep("intent");
  }, [selectedOperation]);

  useEffect(() => {
    const subscription = watch(() => {
      const { intent, fields } = form.getValues();

      if (!operationToEdit) return;

      const updatedOperation = updateOperationFromSchema(operationToEdit, {
        intent,
        fields,
      });

      setUpdatedOperation(selectedOperation);
      saveOperationData(selectedOperation, updatedOperation);
    });
    return () => subscription.unsubscribe();
  }, [
    form,
    operationToEdit,
    saveOperationData,
    selectedOperation,
    watch,
    setUpdatedOperation,
  ]);

  if (!selectedOperation) return null;

  function onSubmit() {
    const { intent, fields } = form.getValues();

    if (!operationToEdit) return;

    const updatedOperation = updateOperationFromSchema(operationToEdit, {
      intent,
      fields,
    });

    setOperationData(
      selectedOperation,
      updatedOperation,
      removeExcludedFields(updatedOperation),
    );
  }

  async function handleAICompletion() {
    setLoadingAI(true);
    setErrorAI(null);
    try {
      const abi = generatedErc7730?.context && 'contract' in generatedErc7730.context ? generatedErc7730.context.contract.abi : undefined;
      const response = await fetch("/api/ai-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: operationToEdit, abi }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unknown error");
      if (!data.result) throw new Error("Empty AI response");
      form.reset(data.result);
    } catch (e: any) {
      setErrorAI(e.message);
    } finally {
      setLoadingAI(false);
    }
  }

  // Complétion IA pour toutes les opérations
  async function handleAICompletionAll() {
    setLoadingAI(true);
    setErrorAI(null);
    try {
      const abi = generatedErc7730?.context && 'contract' in generatedErc7730.context ? generatedErc7730.context.contract.abi : undefined;
      const opNames = Object.keys(operations);
      for (const opName of opNames) {
        const op = operations[opName];
        const response = await fetch("/api/ai-completion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operation: op, abi }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unknown error for " + opName);
        if (!data.result) throw new Error("Empty AI response for " + opName);
        setOperationData(opName, data.result, removeExcludedFields(data.result));
      }
    } catch (e: any) {
      setErrorAI(e.message);
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <>
      <div className="mb-4 flex w-full items-center justify-between">
        <h2 className="text-xl font-bold">{selectedOperation}</h2>
      </div>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <Tabs
            defaultValue="tab1"
            orientation="horizontal"
            value={step}
            onValueChange={(value) => setStep(value)}
          >
            <TabsList className="flew-row mb-6 flex items-center gap-1">
              {["intent", ...formSteps].map((step, index) => (
                <Fragment key={step}>
                  <TabsTrigger
                    className="focus:outline-none data-[state=inactive]:text-neutral-300 dark:data-[state=inactive]:text-neutral-500"
                    value={step}
                  >
                    {step}
                  </TabsTrigger>
                  {index !== formSteps.length && <Slash className="h-4" />}
                </Fragment>
              ))}
            </TabsList>
            <SidebarSeparator className="mb-10" />

            <TabsContent value="intent">
              <OperationInformation
                form={form}
                operationMetadata={operationMetadata}
                onContinue={() => setStep(formSteps[0] ?? "")}
              />
            </TabsContent>
            {form.watch("fields").map((field, index) => (
              <TabsContent value={field.path} key={field.path}>
                <FieldForm
                  field={field}
                  form={form}
                  index={index}
                  operation={operationToEdit}
                  onPrevious={() =>
                    index > 0
                      ? setStep(formSteps[index - 1] ?? "intent")
                      : setStep("intent")
                  }
                  onContinue={
                    formSteps[index + 1]
                      ? () => setStep(formSteps[index + 1] ?? "")
                      : undefined
                  }
                  onLast={
                    formSteps[index + 1]
                      ? undefined
                      : form.handleSubmit(onSubmit)
                  }
                />
              </TabsContent>
            ))}
          </Tabs>
        </form>
      </Form>
    </>
  );
};

export default EditOperation;

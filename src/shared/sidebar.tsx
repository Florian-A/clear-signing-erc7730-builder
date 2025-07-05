"use client";

import {
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarFooter,
  Sidebar,
  SidebarSeparator,
  SidebarMenu,
  SidebarMenuButton,
} from "~/components/ui/sidebar";
import { Ledger } from "~/icons/ledger";
import { useErc7730Store } from "~/store/erc7730Provider";
import SelectOperation from "./selectOperation";
import { Button } from "~/components/ui/button";
import { ModeToggle } from "~/components/ui/theme-switcher";
import { useRouter, usePathname } from "next/navigation";
import useOperationStore from "~/store/useOperationStore";
import ResetButton from "./resetButton";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";

export function AppSidebar() {
  const { getContractAddress } = useErc7730Store((s) => s);
  const router = useRouter();
  const pathname = usePathname();

  const { validateOperation } = useOperationStore();

  const address = getContractAddress();

  const isReviewAccessible = validateOperation.length > 0;

  const isOperation = pathname === "/operations";

  const generatedErc7730 = useErc7730Store((s) => s.generatedErc7730);
  const operations = useErc7730Store((s) => s.generatedErc7730?.display?.formats ?? {});
  const setOperationData = useErc7730Store((s) => s.setOperationData);
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorAI, setErrorAI] = useState<string | null>(null);

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
        setOperationData(opName, data.result, data.result);
      }
    } catch (e: any) {
      setErrorAI(e.message);
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center">
        <div className="rounded bg-black/5 p-4">
          <Ledger size={24} className="stroke-white stroke-1" />
        </div>
        <h1 className="text-base">Clear sign all the things</h1>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup title="Contract">
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold">Contract</h2>
            <div className="break-words rounded border border-neutral-300 bg-black/5 p-3 text-sm">
              {address}
            </div>
          </div>
        </SidebarGroup>
        <SidebarSeparator />

        {isOperation && (
          <>
            <SidebarGroup>
              <SidebarMenu>
                <SidebarMenuButton onClick={() => router.push("/metadata")}>
                  Metadata
                </SidebarMenuButton>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <h2 className="mb-4 text-sm font-bold">
                Operation to clear sign
              </h2>
              <SelectOperation />
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="flex flex-col gap-4">
          <div className="flex flex-row items-center gap-2 w-full">
            <Button
              onClick={handleAICompletionAll}
              disabled={loadingAI || Object.keys(operations).length === 0}
              variant="outline"
              className="flex-1 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loadingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Waiting ...
                </>
              ) : (
                "AI Autofill"
              )}
            </Button>
            <div className="ms-auto">
              <ModeToggle />
            </div>
          </div>
          {errorAI && <div className="text-red-500 mb-2">AI error: {errorAI}</div>}
          <ResetButton />
          <Button
            className="rounded-full"
            disabled={!isReviewAccessible}
            onClick={() => router.push("/review")}
          >
            Review
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

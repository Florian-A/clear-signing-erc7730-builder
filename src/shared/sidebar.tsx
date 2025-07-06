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
  const { getContractAddress, isMetadataValid } = useErc7730Store((s) => s);
  const router = useRouter();
  const pathname = usePathname();

  const { validateOperation } = useOperationStore();

  const address = getContractAddress();

  const isReviewAccessible = validateOperation.length > 0;

  const isOperation = pathname === "/operations";

  const generatedErc7730 = useErc7730Store((s) => s.generatedErc7730);
  const operations = useErc7730Store((s) => s.generatedErc7730?.display?.formats ?? {});
  const setOperationData = useErc7730Store((s) => s.setOperationData);
  const setMetadata = useErc7730Store((s) => s.setMetadata);
  const setContractId = useErc7730Store((s) => s.setContractId);
  const [loadingAI, setLoadingAI] = useState(false);
  const [errorAI, setErrorAI] = useState<string | null>(null);
  const [currentOperationIndex, setCurrentOperationIndex] = useState(0);
  const [totalOperations, setTotalOperations] = useState(0);
  const [shouldStop, setShouldStop] = useState(false);

  // Complétion IA pour toutes les opérations et métadonnées
  async function handleAICompletionAll() {
    if (loadingAI) {
      // Si déjà en cours, arrêter le processus
      setShouldStop(true);
      return;
    }

    setLoadingAI(true);
    setErrorAI(null);
    setShouldStop(false);
    
    try {
      const abi = generatedErc7730?.context && 'contract' in generatedErc7730.context ? generatedErc7730.context.contract.abi : undefined;
      
      if (!abi) {
        setErrorAI("No ABI available for AI completion");
        return;
      }

      // Sur la page metadata, ne remplir que les métadonnées
      if (pathname === "/metadata") {
        const currentMetadata = {
          owner: "",
          info: {
            legalName: "",
            url: "",
          },
          context: {
            $id: "",
          },
        };

        try {
          const metadataResponse = await fetch("/api/ai-completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              metadata: currentMetadata, 
              abi,
              type: "metadata"
            }),
          });
          
          const metadataData = await metadataResponse.json();
          if (metadataResponse.ok && metadataData.result) {
            // Mettre à jour les métadonnées dans le store
            setMetadata({
              owner: metadataData.result.owner || "",
              info: {
                legalName: metadataData.result.info?.legalName || "",
                url: metadataData.result.info?.url || "",
              },
            });
            
            // Mettre à jour le contract ID
            if (metadataData.result.context?.$id) {
              setContractId(metadataData.result.context.$id);
            }
            
            console.log("Metadata completed:", metadataData.result);
          }
        } catch (metadataError) {
          console.warn("Metadata completion failed:", metadataError);
          setErrorAI("Failed to complete metadata");
        }
      } else {
        // Sur la page operations, remplir toutes les opérations
        const opNames = Object.keys(operations).filter((name): name is string => !!name);
        setTotalOperations(opNames.length);
        setCurrentOperationIndex(0);
        
        for (let i = 0; i < opNames.length; i++) {
          if (shouldStop) {
            console.log("AI completion stopped by user");
            break;
          }
          
          const opName = opNames[i];
          if (!opName) continue;
          const op = operations[opName as keyof typeof operations];
          if (!op) continue;
          
          setCurrentOperationIndex(i + 1);
          
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
      }
    } catch (e: any) {
      setErrorAI(e.message);
    } finally {
      setLoadingAI(false);
      setCurrentOperationIndex(0);
      setTotalOperations(0);
      setShouldStop(false);
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="flex flex-row items-center">
        <div className="rounded bg-black/5 p-4">
          <Ledger size={24} className="stroke-white stroke-1" />
        </div>
        <h1 className="text-base font-bold">Clear sign all the things</h1>
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
                <SidebarMenuButton 
                  onClick={() => router.push("/metadata")}
                  isValidated={isMetadataValid()}
                >
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
              disabled={pathname === "/operations" && Object.keys(operations).length === 0}
              variant="outline"
              className="flex-1 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loadingAI ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {pathname === "/operations" && currentOperationIndex > 0 && totalOperations > 0 ? (
                    `${currentOperationIndex}/${totalOperations}`
                  ) : (
                    "Processing..."
                  )}
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

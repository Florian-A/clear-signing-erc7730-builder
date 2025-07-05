"use client";

import { Input } from "~/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";

import { useState, useRef } from "react";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import SampleAddressAbiCard from "./sampleAddressAbiCard";
import { Button } from "~/components/ui/button";
import { Upload } from "lucide-react";

import { ZodError } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useErc7730Store } from "~/store/erc7730Provider";
import useFunctionStore from "~/store/useOperationStore";
import generateFromERC7730 from "./generateFromERC7730";
import { useToast } from "~/hooks/use-toast";

const CardErc7730 = () => {
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<"address" | "abi" | "import">("address");
  const { setErc7730 } = useErc7730Store((state) => state);
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    mutateAsync: fetchERC7730Metadata,
    isPending: loading,
    error,
  } = useMutation({
    mutationFn: (input: string) => {
      if (inputType === "import") {
        throw new Error("Import mode not supported for API calls");
      }
      const validInputType = (inputType === "address" || inputType === "abi" ? inputType : "address") as "address" | "abi";
      return generateFromERC7730({
        input,
        inputType: validInputType,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputType === "import") {
      // Pour l'import, on ne fait rien ici car c'est géré par handleImportJson
      return;
    }
    
    const erc7730 = await fetchERC7730Metadata(input);

    if (erc7730) {
      console.log(erc7730);
      useFunctionStore.persist.clearStorage();

      setErc7730(erc7730);
      router.push("/metadata");
    }
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonContent = JSON.parse(e.target?.result as string);
        
        // Basic ERC7730 JSON validation
        if (!jsonContent.context || !jsonContent.metadata || !jsonContent.display) {
          throw new Error("Invalid JSON format. The file must contain a valid ERC7730 JSON with 'context', 'metadata', and 'display' properties.");
        }

        // Charger le JSON dans le store
        setErc7730(jsonContent);
        
        toast({
          title: "JSON imported successfully!",
          description: "The JSON file has been loaded and you can now edit it.",
        });

        // Rediriger vers la page des métadonnées pour permettre l'édition
        router.push("/metadata");
        
      } catch (error) {
        toast({
          title: "Import error",
          description: error instanceof Error ? error.message : "Invalid file format",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
    
    // Réinitialiser l'input pour permettre de sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const onTabChange = (value: string) => {
    if (value === "address" || value === "abi" || value === "import") {
      setInputType(value as "address" | "abi" | "import");
    }
    setInput("");
  };

  return (
    <div className="w-full lg:w-[580px]">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportJson}
        style={{ display: 'none' }}
      />
      
      <form onSubmit={handleSubmit} className="mb-4 flex w-full flex-col gap-4">
        <Tabs defaultValue="address" onValueChange={onTabChange}>
          <TabsList className="mb-10 grid w-full grid-cols-3">
            <TabsTrigger value="address">Contract Address</TabsTrigger>
            <TabsTrigger value="abi">ABI</TabsTrigger>
            <TabsTrigger value="import">Import JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="address">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eth-address">Contract Address</Label>
                <Input
                  id="contract-address"
                  placeholder="0x..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="abi">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="abi">ABI</Label>
                <Textarea
                  id="abi"
                  placeholder="Paste your ABI here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="import">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Import JSON ERC7730</Label>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 text-center">
                  <Upload className="mb-4 h-8 w-8 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-600">
                    Sélectionnez un fichier JSON ERC7730 précédemment exporté
                  </p>
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleImportClick}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Choisir un fichier
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        {inputType !== "import" && (
          <Button type="submit" disabled={loading}>
            Submit
          </Button>
        )}
      </form>

      {inputType !== "import" && (
        <SampleAddressAbiCard setInput={setInput} inputType={inputType as "address" | "abi"} />
      )}

      {error && (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            {error instanceof ZodError
              ? // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                JSON.parse(error.message)[0].message
              : error.message}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CardErc7730;

"use client";

import { FileJson, Upload } from "lucide-react";
import { Button } from "~/components/ui/button";
import * as React from "react";

import { ResponsiveDialog } from "~/components/ui/responsiveDialog";
import { useErc7730Store } from "~/store/erc7730Provider";
import { useToast } from "~/hooks/use-toast";
import { useRouter } from "next/navigation";

export function ReviewJson() {
  const [open, setOpen] = React.useState(false);
  const erc7730 = useErc7730Store((s) => s.finalErc7730);
  const { setErc7730 } = useErc7730Store((s) => s);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleCopyToClipboard = () => {
    void navigator.clipboard.writeText(JSON.stringify(erc7730, null, 2));
    toast({
      title: "JSON copied to clipboard!",
    });
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

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImportJson}
        style={{ display: 'none' }}
      />
      
      <ResponsiveDialog
        dialogTrigger={<Button variant="outline">Submit</Button>}
        dialogTitle="Submit your JSON"
        open={open}
        setOpen={setOpen}
      >
        <div className="space-y-4 p-4 md:p-0">
          <p className="text-sm text-gray-600">
            Before submitting, please review your JSON. If everything looks good,
            copy it to your clipboard and create a pull request in the following
            repository:
            <a
              href="https://github.com/LedgerHQ/clear-signing-erc7730-registry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              LedgerHQ Clear Signing ERC7730 Registry
            </a>
            .
          </p>
          <pre className="max-h-64 overflow-auto rounded border bg-gray-100 p-4 text-sm dark:text-black">
            {JSON.stringify(erc7730, null, 2)}
          </pre>
          <div className="flex gap-2">
            <Button onClick={handleCopyToClipboard}>Copy JSON to Clipboard</Button>
          </div>
        </div>
      </ResponsiveDialog>

      {/* Bouton d'import séparé */}
      <Button 
        variant="outline" 
        onClick={handleImportClick}
        className="flex items-center gap-2"
      >
        <Upload className="h-4 w-4" />
        Import JSON
      </Button>
    </>
  );
}

export default ReviewJson;

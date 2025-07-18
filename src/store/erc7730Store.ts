import { createStore } from "zustand/vanilla";
import { type Operation, type OperationMetadata, type Erc7730 } from "./types";
import { persist, createJSONStorage } from "zustand/middleware";

export interface Erc7730Store {
  generatedErc7730: Erc7730 | null;
  finalErc7730: Erc7730 | null;
  setErc7730: (by: Erc7730) => void;
  getMetadata: () => Erc7730["metadata"] | null;
  getContractAddress: () => string | null;
  getContractId: () => string | null;
  setContractId: ($id: Erc7730["context"]["$id"]) => void;
  setMetadata: (metadata: Erc7730["metadata"]) => void;
  getOperations: () => Erc7730["display"] | null;
  getOperationsMetadata: (name: string | null) => OperationMetadata | null;
  getFinalOperationsMetadata: (name: string | null) => OperationMetadata | null;
  getOperationsByName: (name: string | null) => Operation | null;
  getFinalOperationByName: (name: string | null) => Operation | null;
  saveOperationData: (name: string, operationData: Operation) => void;
  setOperationData: (
    name: string,
    operationData: Operation,
    filteredOperationData: Operation,
  ) => void;
  isMetadataValid: () => boolean;
}

export const createErc7730Store = () => {
  return createStore<Erc7730Store>()(
    persist(
      (set, get) => ({
        generatedErc7730: null,
        finalErc7730: null,
        getOperationsByName: (name) => {
          if (!name) return null;
          const formats = get().generatedErc7730?.display?.formats ?? {};
          return formats[name] ?? null;
        },
        getFinalOperationByName: (name) => {
          if (!name) return null;
          const formats = get().finalErc7730?.display?.formats ?? {};
          return formats[name] ?? null;
        },
        saveOperationData: (name, operationData) => {
          set((state) => ({
            generatedErc7730: {
              ...state.generatedErc7730!,
              display: {
                ...state.generatedErc7730!.display,
                formats: {
                  ...state.generatedErc7730?.display?.formats,
                  [name]: operationData,
                },
              },
            },
          }));
        },
        setOperationData: (name, operationData, filteredOperationData) => {
          set((state) => ({
            generatedErc7730: {
              ...state.generatedErc7730!,
              display: {
                ...state.generatedErc7730!.display,
                formats: {
                  ...state.generatedErc7730?.display?.formats,
                  [name]: operationData,
                },
              },
            },
            finalErc7730: {
              ...state.finalErc7730!,
              display: {
                ...state.finalErc7730!.display,
                formats: {
                  ...state.finalErc7730?.display?.formats,
                  [name]: filteredOperationData,
                },
              },
            },
          }));
        },
        getContractAddress: () => {
          const { generatedErc7730 } = get();
          const context = generatedErc7730?.context;
          if (!context) return "";

          if ("contract" in context) {
            return context.contract.deployments[0]?.address ?? "";
          }
          return "";
        },
        getContractId: () => {
          const { generatedErc7730 } = get();
          const context = generatedErc7730?.context;
          if (!context) return "";

          if ("$id" in context) {
            return context.$id ?? "";
          }
          return "";
        },
        setErc7730: (generatedErc7730) => set(() => ({ generatedErc7730 })),
        getOperations: () => get().generatedErc7730?.display ?? null,
        getMetadata: () => get().generatedErc7730?.metadata ?? null,
        getOperationsMetadata: (name) => {
          if (!name) return null;
          const formats = get().generatedErc7730?.display?.formats ?? {};
          const intent = formats[name]?.intent;

          return {
            operationName: typeof intent === "string" ? intent : "",
            metadata: get().generatedErc7730?.metadata ?? null,
          };
        },
        getFinalOperationsMetadata: (name) => {
          if (!name) return null;
          const formats = get().finalErc7730?.display?.formats ?? {};
          const intent = formats[name]?.intent;

          return {
            operationName: typeof intent === "string" ? intent : "",
            metadata: get().finalErc7730?.metadata ?? null,
          };
        },
        setContractId: ($id) =>
          set((state) => ({
            generatedErc7730: {
              ...state.generatedErc7730!,
              context: {
                ...state.generatedErc7730!.context,
                $id,
              },
            },
            finalErc7730: {
              $schema: state.generatedErc7730!.$schema,
              context: { ...state.generatedErc7730!.context, $id },
              metadata: state.generatedErc7730!.metadata,
              display: state.finalErc7730
                ? {
                    ...state.finalErc7730.display,
                    formats: state.finalErc7730.display.formats ?? {},
                  }
                : { formats: {} },
            },
          })),
        setMetadata: (metadata) =>
          set((state) => ({
            generatedErc7730: {
              ...state.generatedErc7730!,
              metadata,
            },
            finalErc7730: {
              $schema: state.generatedErc7730!.$schema,
              context: state.generatedErc7730!.context,
              metadata,
              display: state.finalErc7730
                ? {
                    ...state.finalErc7730.display,
                    formats: state.finalErc7730.display.formats ?? {},
                  }
                : { formats: {} },
            },
          })),
        isMetadataValid: () => {
          const { generatedErc7730 } = get();
          if (!generatedErc7730?.metadata) return false;
          
          const metadata = generatedErc7730.metadata;
          const context = generatedErc7730.context;
          
          // Vérifier que tous les champs requis sont remplis
          return !!(
            metadata.owner &&
            metadata.owner.trim() !== "" &&
            metadata.info?.legalName &&
            metadata.info.legalName.trim() !== "" &&
            metadata.info?.url &&
            metadata.info.url.trim() !== "" &&
            context.$id &&
            context.$id.trim() !== ""
          );
        },
      }),

      {
        storage: createJSONStorage(() => sessionStorage),
        name: "store-erc7730",
        skipHydration: true,
      },
    ),
  );
};

export default createErc7730Store;

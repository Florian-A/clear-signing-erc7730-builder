import Image from "next/image";
import { type ReactNode } from "react";
import flexChevronLeft from "./assets/flex-chevron-left.svg";
import flexChevronRight from "./assets/flex-chevron-right.svg";
import { Device } from "./device";
import { cn } from "~/lib/utils";

// Dimensions of the area to display the fields: 480px x 464px
// Number of lines for tags & values: 9

export const Flex = {
  Bezel: ({
    children,
    size,
    alwaysVisible = false,
  }: {
    children: ReactNode;
    size: "small" | "medium" | "normal";
    alwaysVisible?: boolean;
  }) => (
    <div
      className={cn(
        alwaysVisible ? "block" : "hidden min-[1000px]:block",
        "h-[416.5px] w-[301.5px] bg-[url(/assets/DeviceBezel-Flex.png)] bg-contain bg-no-repeat p-[29.5px]",
        size === "medium" && "h-[312px] w-[226px] p-[22px]",
        size === "small" && "h-[41.6px] w-[30.1px] p-0",
      )}
    >
      <div
        className={cn(
          "flex h-[300px] w-[240px] rounded-[8px]",
          size === "medium" && "h-[100%] w-[100%] rounded-[6px]",
          size === "small" && "flex h-full w-full items-center",
        )}
      >
        {children}
      </div>
    </div>
  ),
  Pagination: ({
    current,
    total,
    size = "medium",
  }: {
    current: number;
    total: number;
    size?: "small" | "medium";
  }) => {
    const first = current === 1;
    const last = current === total;

    return (
      <div className="flex border-t border-gray-200">
        <div
          className={cn(
            "border-r border-gray-200 py-[14px]",
            size === "small" ? "px-[24.5px]" : "px-[40.5px]",
          )}
        >
          <Device.ActionText>Reject</Device.ActionText>
        </div>
        <div
          className={cn(
            "flex w-full items-center justify-center px-3 text-[#959595]",
            size === "small" ? "gap-1 px-1" : "gap-3",
          )}
        >
          <Image
            src={flexChevronLeft as string}
            alt="left"
            className={cn(
              "inline-block",
              first ? "opacity-20" : "",
              size === "small" ? "h-[12px]" : "h-[15px]",
            )}
          />
          <Device.ContentText>
            {current} of {total}
          </Device.ContentText>
          <Image
            src={flexChevronRight as string}
            alt="left"
            className={cn(
              "inline-block",
              last ? "opacity-20" : "",
              size === "small" ? "h-[12px]" : "h-[15px]",
            )}
          />
        </div>
      </div>
    );
  },
};

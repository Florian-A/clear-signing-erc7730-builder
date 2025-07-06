import { type ReactNode } from "react";
import Image from "next/image";
import flexInfo from "./assets/flex-info.svg";
import staxInfo from "./assets/stax-info.svg";
import flexSignButton from "./assets//flex-sign-button.svg";
import staxSignButton from "./assets//stax-sign-button.svg";
import { cn } from "~/lib/utils";
import { Stax } from "./stax";
import { Flex } from "./flex";

export const Device = {
  ActionText: ({ children }: { children: ReactNode }) => {
    const isStax = false;

    return (
      <div
        className={cn(
          "font-semibold",
          isStax ? "text-[10px] leading-[14px]" : "text-[12px] leading-[12px]",
        )}
      >
        {children}
      </div>
    );
  },
  ContentText: ({
    children,
    size = "normal",
  }: {
    children: ReactNode;
    size?: "small" | "normal";
  }) => {
    const isStax = false;
    const smallSizeText =
      size === "small"
        ? "text-[11px] leading-[12px]"
        : "text-[13px] leading-[18px]";
    return (
      <div
        className={cn(
          "break-words",
          isStax ? "text-[10px] leading-[14px]" : smallSizeText,
        )}
      >
        {children}
      </div>
    );
  },
  Frame: ({
    children,
    size = "normal",
    alwaysVisible = false,
  }: {
    children: ReactNode;
    size?: "small" | "medium" | "normal";
    alwaysVisible?: boolean;
  }) => {
    const isStax = false;
    const Component = isStax ? Stax : Flex;

    return (
      <Component.Bezel size={size} alwaysVisible={alwaysVisible}>
        <div
          className={cn(
            "flex w-full flex-col justify-between text-black antialiased",
            size === "small" && "items-center",
          )}
        >
          {children}
        </div>
      </Component.Bezel>
    );
  },
  HeadingText: ({ children }: { children: ReactNode }) => {
    const isStax = false;

    return (
      <div
        className={cn(
          "font-medium leading-[20px]",
          isStax ? "text-[14px]" : "text-[18px]",
        )}
      >
        {children}
      </div>
    );
  },
  InfoBlock: ({ owner }: { owner: string }) => {
    const isStax = false;

    return (
      <div
        className={cn(
          "flex items-center",
          isStax ? "gap-3 p-3" : "gap-4 px-4 py-3",
        )}
      >
        <div>
          <Device.ContentText>
            {`You're interacting with a smart contract from ${owner}.`}
          </Device.ContentText>
        </div>
        <div>
          <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-gray-200">
            {isStax ? (
              <Image
                src={staxInfo as string}
                alt="More info"
                width={14}
                height={14}
              />
            ) : (
              <Image
                src={flexInfo as string}
                alt="More info"
                width={18}
                height={18}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
  Icon: ({ bg }: { bg: string }) => (
    <div
      className={cn(
        "h-[32px] w-[32px] self-center bg-contain bg-no-repeat",
        bg,
      )}
    />
  ),
  OperationSummary: ({
    children,
    type,
  }: {
    children: string;
    type: string;
  }) => {
    const isStax = false;
    const iconBg =
      type === "message"
        ? "bg-[url(/assets/scroll.svg)]"
        : "bg-[url(/assets/eth.svg)]";

    return (
      <div
        className={cn(
          "align-center flex grow flex-col justify-center gap-3",
          isStax ? "p-3" : "p-4",
        )}
      >
        <Device.Icon bg={iconBg} />
        <Device.HeadingText>
          <div className="text-center">{children}</div>
        </Device.HeadingText>
      </div>
    );
  },
  Pagination: ({
    current,
    total,
    size,
  }: {
    current: number;
    total: number;
    size?: "small" | "medium";
  }) => {
    const isStax = false;

    return isStax ? (
      <Stax.Pagination size={size} current={current} total={total} />
    ) : (
      <Flex.Pagination
        size={size ?? undefined}
        current={current}
        total={total}
      />
    );
  },
  Section: ({ children }: { children: ReactNode }) => {
    const isStax = false;

    return (
      <div
        className={cn(
          "flex w-[99%] flex-col border-b border-gray-200 py-[14px] last:border-0",
          isStax ? "gap-[8px] px-3" : "gap-[6px] px-4",
        )}
      >
        {children}
      </div>
    );
  },
  SignButton: () => {
    const isStax = false;

    const Button = () =>
      isStax ? (
        <Image
          src={staxSignButton as string}
          alt="Sign"
          width={40}
          height={40}
        />
      ) : (
        <Image
          src={flexSignButton as string}
          alt="Sign"
          width={44}
          height={44}
        />
      );

    return (
      <div
        className={cn(
          "flex items-center justify-between",
          isStax ? "px-3 py-[10px]" : "p-4",
        )}
      >
        <Device.HeadingText>Hold to sign</Device.HeadingText>
        <div
          className={cn(
            "flex items-center justify-center rounded-full border border-gray-200",
            isStax ? "h-[38px] w-[38px]" : "h-[42px] w-[42px]",
          )}
        >
          <Button />
        </div>
      </div>
    );
  },
};

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { ReactNode } from "react";

export const Header = () => {
  return (
    <header className="flex items-center justify-between mb-16">
      <div className="flex">
        <Image src="/images/quill.png" alt="" width={40} height={40} />
        <h1 className="text-4xl italic ml-4">World Novel</h1>
      </div>
      <div className="flex gap-4 items-center">
        <HeaderButton href="/">Current Book</HeaderButton>
        <HeaderButton href="/proposals">Proposals</HeaderButton>
        <ConnectButton />
      </div>
    </header>
  );
};

const HeaderButton = ({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) => {
  const { pathname } = useRouter();
  const selected = pathname === href;

  return (
    <Link href={href}>
      <a className="relative">
        <span className="text-lg block">{children}</span>
        {selected && (
          <div
            className="w-10/12 my-1 mx-auto h-[2px] bg-purple-500
          absolute -bottom-2 left-0 right-0"
          ></div>
        )}
      </a>
    </Link>
  );
};

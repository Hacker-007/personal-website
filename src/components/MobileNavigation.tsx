import { useState, type ReactNode } from "react";

import CrossIcon from "./icons/CrossIcon";
import ThreeBarIcon from "./icons/ThreeBarIcon";

function MobileNavigationLink({
  ariaLabel,
  href,
  children,
}: {
  ariaLabel: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <div>
      <a
        key={href}
        aria-label={ariaLabel}
        href={href}
        className="cursor-pointer text-2xl font-light"
      >
        {children}
      </a>
    </div>
  );
}

export default function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav>
      <button className="cursor-pointer" onClick={() => setIsOpen(true)}>
        <ThreeBarIcon className="size-6" />
      </button>
      {isOpen ? (
        <div
          key="menu"
          className="fixed right-0 top-0 flex h-screen w-screen origin-top-right flex-col items-end gap-7 bg-[#f2e9e1] px-6 pt-6"
        >
          <button className="cursor-pointer" onClick={() => setIsOpen(false)}>
            <CrossIcon className="size-6 text-[#575279]" />
          </button>
          <div className="flex flex-col gap-4 text-right text-[#575279]">
            <MobileNavigationLink ariaLabel="Project Page" href="/projects">
              Projects
            </MobileNavigationLink>
            <MobileNavigationLink ariaLabel="Blog Page" href="/projects">
              Blog
            </MobileNavigationLink>
            <MobileNavigationLink ariaLabel="Resume Page" href="/resume">
              Resume
            </MobileNavigationLink>
          </div>
        </div>
      ) : null}
    </nav>
  );
}

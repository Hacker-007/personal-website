import { useState, type ReactNode } from "react";

import { AnimatePresence, motion, type Variants } from "motion/react";

import CrossIcon from "./icons/CrossIcon";
import ThreeBarIcon from "./icons/ThreeBarIcon";

const menuAnimation: Variants = {
  initial: {
    height: 0,
  },
  animate: {
    height: "100vh",
    transition: {
      duration: 0.5,
      ease: [0.12, 0, 0.39, 0],
      when: "beforeChildren",
    },
  },
  exit: {
    height: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      when: "afterChildren",
    },
  },
};

const closeButtonAnimation: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

const linkContainerAnimation: Variants = {
  initial: {
    opacity: 0,
    transition: {
      staggerChildren: 0.09,
      staggerDirection: -1,
    },
  },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      staggerDirection: 1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.09,
      staggerDirection: -1,
    },
  },
};

const linkAnimation: Variants = {
  initial: {
    opacity: 0,
    y: 50,
    transition: {
      ease: [0.37, 0, 0.63, 1],
    },
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ease: [0, 0.55, 0.45, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 50,
    transition: {
      ease: [0.37, 0, 0.63, 1],
    },
  },
};

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
    <motion.div key={href} variants={linkAnimation}>
      <a
        aria-label={ariaLabel}
        href={href}
        className="cursor-pointer text-2xl font-light"
      >
        {children}
      </a>
    </motion.div>
  );
}

export default function MobileNavigation({
  className,
}: {
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className={className}>
      <button className="cursor-pointer" onClick={() => setIsOpen(true)}>
        <ThreeBarIcon className="size-6" />
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="menu"
            variants={menuAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed right-0 top-0 flex w-screen origin-top-right flex-col items-end gap-7 bg-[#f2e9e1]"
          >
            <motion.button
              key="close"
              variants={closeButtonAnimation}
              className="cursor-pointer px-6 pt-6"
              onClick={() => setIsOpen(false)}
            >
              <CrossIcon className="size-6 text-[#575279]" />
            </motion.button>
            <motion.div
              key="links"
              variants={linkContainerAnimation}
              className="flex flex-col gap-4 overflow-hidden px-6 text-right text-[#575279]"
            >
              <MobileNavigationLink ariaLabel="Project Page" href="/projects">
                Projects
              </MobileNavigationLink>
              <MobileNavigationLink ariaLabel="Blog Page" href="/projects">
                Blog
              </MobileNavigationLink>
              <MobileNavigationLink ariaLabel="Resume Page" href="/resume">
                Resume
              </MobileNavigationLink>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </nav>
  );
}

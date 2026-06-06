"use client";

import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_DATA } from "./data";
import { ArrowLeftIcon, ChevronUp } from "./icons";
import { MenuItem } from "./menu-item";
import { useSidebarContext } from "./sidebar-context";

export function Sidebar() {
  const pathname = usePathname();
  const { setIsOpen, isOpen, isMobile, toggleSidebar, isCollapsed, toggleCollapse } = useSidebarContext();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);

  // Close flyout when sidebar toggles
  useEffect(() => {
    setActiveFlyout(null);
  }, [isCollapsed]);

  const toggleExpanded = (title: string) => {
    if (isCollapsed && !isMobile) {
      setActiveFlyout((prev) => (prev === title ? null : title));
    } else {
      setExpandedItems((prev) => (prev.includes(title) ? [] : [title]));
    }
  };

  useEffect(() => {
    // Keep collapsible open, when it's subpage is active
    NAV_DATA.some((section) => {
      return section.items.some((item) => {
        return item.items.some((subItem) => {
          if (subItem.url === pathname) {
            setExpandedItems((prev) =>
              prev.includes(item.title) ? prev : [...prev, item.title]
            );
            return true;
          }
        });
      });
    });
  }, [pathname]);

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "relative border-r border-gray-200 bg-white transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-dark shrink-0",
          isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen z-40",
          isOpen ? (isCollapsed && !isMobile ? "w-[88px]" : "w-[260px]") : "w-0",
        )}
        aria-label="Main navigation"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="absolute -right-3.5 top-[30px] z-50 flex size-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm hover:bg-gray-50 hover:text-dark dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white transition-all"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronUp className={cn("size-4 transition-transform", isCollapsed ? "rotate-90" : "-rotate-90")} />
          </button>
        )}

        <div className={cn(
          "flex h-full w-full flex-col py-6 transition-all duration-300",
          isCollapsed && !isMobile ? "px-3 overflow-visible" : "px-5 overflow-hidden"
        )}>
          <div className="relative mb-3 flex min-h-[40px] items-center justify-center">
            <Link
              href={"/"}
              onClick={() => isMobile && toggleSidebar()}
              className={cn("block px-0 py-2.5 min-[850px]:py-0", !isCollapsed && "mr-auto")}
            >
              <Logo isCollapsed={isCollapsed && !isMobile} />
            </Link>

            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="absolute right-0"
              >
                <span className="sr-only">Close Menu</span>
                <ArrowLeftIcon className="size-7" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <div className={cn(
            "custom-scrollbar mt-3 flex-1 min-[850px]:mt-5",
            isCollapsed && !isMobile ? "overflow-visible" : "overflow-y-auto"
          )}>
            {NAV_DATA.map((section) => (
              <div key={section.label} className="mb-6">
                <h2 className={cn(
                  "mb-5 text-sm font-medium text-dark-4 transition-all duration-300 dark:text-dark-6",
                  isCollapsed && !isMobile ? "opacity-0 h-0 mb-0 overflow-hidden" : "opacity-100"
                )}>
                  {section.label}
                </h2>

                <nav role="navigation" aria-label={section.label}>
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item.title} className="relative">
                        {item.items.length ? (
                          <div className="relative">
                            <MenuItem
                              isActive={item.items.some(
                                ({ url }) => url === pathname,
                              )}
                              onClick={() => toggleExpanded(item.title)}
                              className={cn(isCollapsed && !isMobile && "justify-center px-0")}
                            >
                              <item.icon
                                className="size-6 shrink-0"
                                aria-hidden="true"
                              />

                              <span className={cn(
                                "transition-all duration-300 whitespace-nowrap overflow-hidden text-left",
                                isCollapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100 flex-1"
                              )}>
                                {item.title}
                              </span>

                              <ChevronUp
                                className={cn(
                                  "ml-auto rotate-180 transition-transform duration-200 shrink-0",
                                  expandedItems.includes(item.title) && "rotate-0",
                                  isCollapsed && !isMobile && "hidden"
                                )}
                                aria-hidden="true"
                              />
                            </MenuItem>

                            {/* Flyout menu for collapsed state */}
                            {activeFlyout === item.title && isCollapsed && !isMobile && (
                              <ul
                                className="absolute left-full top-0 ml-4 w-48 rounded-lg bg-white p-2 shadow-lg ring-1 ring-gray-200 dark:bg-gray-dark dark:ring-gray-800 z-[60]"
                                role="menu"
                              >
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <MenuItem
                                      as="link"
                                      href={subItem.url}
                                      isActive={pathname === subItem.url}
                                      className="py-2.5 px-3"
                                      onClick={() => setActiveFlyout(null)}
                                    >
                                      <span>{subItem.title}</span>
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Inline menu for expanded state */}
                            {expandedItems.includes(item.title) && (!isCollapsed || isMobile) && (
                              <ul
                                className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                role="menu"
                              >
                                {item.items.map((subItem) => (
                                  <li key={subItem.title} role="none">
                                    <MenuItem
                                      as="link"
                                      href={subItem.url}
                                      isActive={pathname === subItem.url}
                                    >
                                      <span>{subItem.title}</span>
                                    </MenuItem>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ) : (
                          (() => {
                            const href =
                              "url" in item
                                ? item.url + ""
                                : "/" +
                                item.title.toLowerCase().split(" ").join("-");

                            return (
                              <MenuItem
                                className={cn(
                                  "flex items-center gap-3 py-3",
                                  isCollapsed && !isMobile && "justify-center px-0 gap-0"
                                )}
                                as="link"
                                href={href}
                                isActive={pathname === href}
                              >
                                <item.icon
                                  className="size-6 shrink-0"
                                  aria-hidden="true"
                                />

                                <span className={cn(
                                  "transition-all duration-300 whitespace-nowrap overflow-hidden text-left",
                                  isCollapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100 flex-1"
                                )}>
                                  {item.title}
                                </span>
                              </MenuItem>
                            );
                          })()
                        )}
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

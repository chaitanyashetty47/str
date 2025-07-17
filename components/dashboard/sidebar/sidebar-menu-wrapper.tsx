"use client";

// External dependencies
import { ChevronRight, LucideIcon } from "lucide-react";
import Link from "next/link";

// Internal components
import { cn } from "@/lib/utils";
import {
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { SidebarSubmenuWrapper } from "./sidebar-submenu-wrapper";

/**
 * Props interface for SidebarMenuWrapper component
 * @interface Props
 * @property {Object} item - Navigation item data
 * @property {string} item.title - Title of the navigation item
 * @property {string} item.url - URL for the navigation item
 * @property {LucideIcon} item.icon - Icon component for the navigation item
 * @property {Object[]} [item.items] - Optional sub-items for the navigation item
 * @property {string} item.items[].title - Title of the sub-item
 * @property {string} item.items[].url - URL for the sub-item
 * @property {boolean} item.items[].isActive - Whether the sub-item is active
 */
type Props = {
  item: {
    title: string;
    url: string;
    icon: LucideIcon;
    items?: {
      title: string;
      url: string;
      isActive: boolean;
    }[];
  };
};

/**
 * SidebarMenuWrapper Component
 *
 * Wrapper for sidebar menu items with collapsible functionality.
 * Handles different display modes (expanded vs collapsed) and hover cards.
 * Main menu items are now clickable and navigate to their URLs.
 *
 * @param {Props} props - Component props
 */
export function SidebarMenuWrapper({ item }: Props) {
  const { state, isMobile } = useSidebar();

  const isSubmenuActive = item.items?.some((item) => item.isActive);
  const hasSubItems = item.items && item.items.length > 0;

  const isPopover = state === "collapsed" && !isMobile;

  if (isPopover) {
    return (
      <SidebarMenuItem>
        <HoverCard openDelay={50} closeDelay={100}>
          <HoverCardTrigger asChild>
            {hasSubItems ? (
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className={cn(
                    "cursor-pointer hover:bg-transparent hover:font-bold hover:underline hover:underline-offset-4 active:bg-transparent data-[state=open]:hover:bg-transparent",
                    isSubmenuActive && "font-bold",
                  )}
                  aria-label={item.title}
                  aria-expanded="false"
                  aria-haspopup="true"
                >
                  <item.icon
                    strokeWidth={isSubmenuActive ? 2.5 : 1.8}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-balance">{item.title}</span>
                </SidebarMenuButton>
              </CollapsibleTrigger>
            ) : (
              <SidebarMenuButton
                asChild
                className={cn(
                  "cursor-pointer hover:bg-transparent hover:font-bold hover:underline hover:underline-offset-4 active:bg-transparent",
                  isSubmenuActive && "font-bold",
                )}
                aria-label={item.title}
              >
                <Link href={item.url}>
                  <item.icon
                    strokeWidth={isSubmenuActive ? 2.5 : 1.8}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-balance">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </HoverCardTrigger>
          <HoverCardContent
            side="right"
            align="start"
            className="w-fit min-w-52 px-0"
            role="menu"
            aria-label={`${item.title} submenu`}
          >
            <div className="flex flex-col gap-2">
              {hasSubItems ? (
                <div
                  className={cn(
                    "flex items-center gap-2 border-b px-4 pb-2",
                    isSubmenuActive && "font-bold",
                  )}
                >
                  <item.icon
                    className="size-4"
                    strokeWidth={isSubmenuActive ? 2.5 : 1.8}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-balance">{item.title}</span>
                </div>
              ) : (
                <Link
                  href={item.url}
                  className={cn(
                    "flex items-center gap-2 border-b px-4 pb-2 hover:bg-transparent hover:font-bold",
                    isSubmenuActive && "font-bold",
                  )}
                >
                  <item.icon
                    className="size-4"
                    strokeWidth={isSubmenuActive ? 2.5 : 1.8}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-balance">{item.title}</span>
                </Link>
              )}
              {hasSubItems && <SidebarSubmenuWrapper isPopover={isPopover} item={item} />}
            </div>
          </HoverCardContent>
        </HoverCard>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      {hasSubItems ? (
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={cn(
              "cursor-pointer hover:bg-transparent hover:font-bold hover:underline hover:underline-offset-4 active:bg-transparent data-[state=open]:hover:bg-transparent",
              isSubmenuActive && "font-bold",
            )}
            aria-label={item.title}
            aria-expanded="false"
            aria-haspopup="true"
          >
            <item.icon
              strokeWidth={isSubmenuActive ? 2.5 : 1.8}
              aria-hidden="true"
            />
            <span>{item.title}</span>
          </SidebarMenuButton>
        </CollapsibleTrigger>
      ) : (
        <SidebarMenuButton
          asChild
          tooltip={item.title}
          className={cn(
            "cursor-pointer hover:bg-transparent hover:font-bold hover:underline hover:underline-offset-4 active:bg-transparent",
            isSubmenuActive && "font-bold",
          )}
          aria-label={item.title}
        >
          <Link href={item.url}>
            <item.icon
              strokeWidth={isSubmenuActive ? 2.5 : 1.8}
              aria-hidden="true"
            />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      )}
      {hasSubItems && (
        <>
          <CollapsibleTrigger asChild>
            <SidebarMenuAction
              className="cursor-pointer hover:bg-transparent data-[state=open]:rotate-90"
              aria-label={`Toggle ${item.title} submenu`}
            >
              <ChevronRight aria-hidden="true" />
              <span className="sr-only">Toggle</span>
            </SidebarMenuAction>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarSubmenuWrapper isPopover={isPopover} item={item} />
          </CollapsibleContent>
        </>
      )}
    </SidebarMenuItem>
  );
}

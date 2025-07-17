"use client";

// External dependencies
import { LucideIcon } from "lucide-react";

// Internal components
import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

/**
 * Props interface for SidebarSubmenuWrapper component
 * @interface Props
 * @property {Object} item - Navigation item data
 * @property {string} item.title - Title of the navigation item
 * @property {string} item.url - URL for the navigation item
 * @property {LucideIcon} item.icon - Icon component for the navigation item
 * @property {Object[]} [item.items] - Optional sub-items for the navigation item
 * @property {string} item.items[].title - Title of the sub-item
 * @property {string} item.items[].url - URL for the sub-item
 * @property {boolean} item.items[].isActive - Whether the sub-item is active
 * @property {boolean} isPopover - Whether the submenu is displayed as a popover
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
  isPopover: boolean;
};

/**
 * SidebarSubmenuWrapper Component
 *
 * Renders submenu items within a sidebar menu item.
 * Adapts styling based on whether it's displayed in a popover or inline.
 *
 * @param {Props} props - Component props
 */
export function SidebarSubmenuWrapper({ item, isPopover }: Props) {
  return (
    <SidebarMenuSub
      className={cn(
        // When rendered inside a hover popover we need to ensure the list is
        // visible even if the parent sidebar is in `icon` (collapsed) mode.
        // The base SidebarMenuSub component applies `group-data-[collapsible=icon]:hidden`,
        // which hides the element when the sidebar is collapsed.  We override
        // that rule here with `!flex` so that it is displayed within the
        // popover while keeping the original spacing tweaks.
        isPopover && "mx-0 border-none px-0 !flex",
        !isPopover && "border-gray-700",
      )}
      role="menu"
      aria-label={`${item.title} submenu items`}
    >
      {item.items?.map((subItem) => (
        <SidebarMenuSubItem key={subItem.title} role="menuitem">
          <SidebarMenuSubButton
            asChild
            className={cn(
              "hover:bg-transparent hover:font-bold hover:underline hover:underline-offset-4 active:bg-transparent",
              subItem.isActive && "font-bold underline underline-offset-4",
              // Ensure visibility inside the popover even when the parent
              // sidebar is in icon-collapsed mode which applies `hidden`.
              isPopover && "px-4 !flex",
            )}
          >
            <a
              href={subItem.url}
              aria-label={subItem.title}
              aria-current={subItem.isActive ? "page" : undefined}
            >
              <span>{subItem.title}</span>
            </a>
          </SidebarMenuSubButton>
        </SidebarMenuSubItem>
      ))}
    </SidebarMenuSub>
  );
}

# Advanced Data Table Implementation Guide

This guide provides a comprehensive breakdown of building a sophisticated data table with advanced filtering, sorting, and pagination capabilities. The implementation uses TanStack Table (React Table v8) with TypeScript and follows modern React patterns.

## Table of Contents
1. [Overall Architecture](#overall-architecture)
2. [Page Structure & Layout](#page-structure--layout)
3. [Filter System Design](#filter-system-design)
4. [Table Component Architecture](#table-component-architecture)
5. [Column Definitions & Cell Rendering](#column-definitions--cell-rendering)
6. [Header Cell Design](#header-cell-design)
7. [Pagination System](#pagination-system)
8. [Data Management & State](#data-management--state)
9. [Styling & Design Patterns](#styling--design-patterns)
10. [Responsive Design Considerations](#responsive-design-considerations)

## Overall Architecture

### Component Hierarchy
```
CustomersPage (Main Container)
├── Page Header (Title + Action Button)
├── Table Container (Card with border)
│   ├── Filters Section (Border-bottom)
│   │   └── CustomersFilters
│   └── Table Section (Padding)
│       └── CustomersTable
│           ├── Table Header (Sortable columns)
│           ├── Table Body (Data rows)
│           └── Pagination (Separator + Controls)
└── Empty State (Conditional)
```

### Key Design Principles
- **Card-based Layout**: Table wrapped in a bordered card for visual separation
- **Sectioned Filters**: Filters in a separate bordered section above the table
- **Consistent Spacing**: 4-unit gap system throughout
- **Responsive Design**: Mobile-first approach with breakpoint considerations

## Page Structure & Layout

### Main Page Container
```tsx
<div className="flex flex-col gap-4">
  {/* Page Header */}
  {/* Table Card */}
  {/* Empty State */}
</div>
```

**Design Details:**
- Uses `flex flex-col` for vertical stacking
- `gap-4` provides consistent 16px spacing between sections
- Maintains clean visual hierarchy

### Page Header Design
```tsx
<div className="flex items-center justify-between">
  <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
  <div className="flex items-center gap-4">
    <Link href="/dashboard/customers/new">
      <Button>
        <Plus className="size-4" />
        New Customer
      </Button>
    </Link>
  </div>
</div>
```

**Design Details:**
- **Typography**: `text-2xl font-bold tracking-tight` for prominent page title
- **Button Design**: Icon + text with `size-4` icon (16px)
- **Spacing**: `gap-4` between action buttons
- **Alignment**: `justify-between` for title and actions

### Table Card Container
```tsx
<div className="rounded-lg border bg-card">
  <div className="border-b p-4">
    {/* Filters */}
  </div>
  <div className="p-3">
    {/* Table */}
  </div>
</div>
```

**Design Details:**
- **Card Styling**: `rounded-lg border bg-card` for elevated appearance
- **Section Separation**: `border-b` creates visual divider between filters and table
- **Padding**: `p-4` for filters, `p-3` for table (slightly tighter)
- **Background**: `bg-card` ensures proper theming support

## Filter System Design

### Filter Container Layout
```tsx
<div className="flex w-full flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
  {/* Search Input */}
  {/* Filter Controls */}
</div>
```

**Design Details:**
- **Responsive Layout**: Column on mobile, row on large screens
- **Flex Distribution**: Search takes `flex-1`, filters wrap
- **Gap System**: `gap-4` on mobile, `gap-6` on desktop
- **Alignment**: `items-center` for vertical centering

### Search Input Design
```tsx
<div className="relative flex-1">
  <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
  <Input
    placeholder="Search customers..."
    value={filters.search}
    onChange={(e) => onFiltersChange({ search: e.target.value })}
    className="pl-9"
  />
</div>
```

**Design Details:**
- **Icon Positioning**: Absolute positioned with `top-1/2 -translate-y-1/2` for perfect centering
- **Icon Styling**: `text-muted-foreground` for subtle appearance
- **Input Padding**: `pl-9` (36px) to accommodate icon
- **Responsive Width**: `flex-1` allows search to expand

### Dropdown Filter Design
```tsx
<Select
  value={filters.status}
  onValueChange={(value) =>
    onFiltersChange({ status: value as CustomerStatus | "all" })
  }
>
  <SelectTrigger className="w-full md:w-[180px]">
    <SelectValue placeholder="Filter by status" />
  </SelectTrigger>
  <SelectContent>
    {STATUS_OPTIONS.map((option) => (
      <SelectItem key={option.value} value={option.value}>
        {option.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Design Details:**
- **Responsive Width**: `w-full` on mobile, `w-[180px]` on desktop
- **Elliptical Nature**: Select component has rounded corners and smooth transitions
- **Placeholder Text**: Clear, descriptive placeholder
- **Option Structure**: Array of `{label, value}` objects for maintainability

### Date Range Picker Design
```tsx
<DatePickerWithRange
  className="w-full md:w-auto"
  value={{
    from: filters.dateRange.from,
    to: filters.dateRange.to,
  }}
  onChange={(dateRange) =>
    onFiltersChange({
      dateRange: dateRange
        ? { from: dateRange.from, to: dateRange.to }
        : { from: undefined, to: undefined },
    })
  }
/>
```

**Design Details:**
- **Responsive Width**: Full width on mobile, auto on desktop
- **Date Formatting**: Uses `date-fns` for consistent date formatting
- **Range Display**: Shows "MMM dd, yyyy - MMM dd, yyyy" format
- **Calendar Popover**: 2-month view with proper positioning

## Table Component Architecture

### Table Container Structure
```tsx
<div className="space-y-4">
  <Table>
    <TableHeader>
      {/* Sortable Headers */}
    </TableHeader>
    <TableBody>
      {/* Data Rows */}
    </TableBody>
  </Table>
  <Separator />
  <CustomersTablePagination />
</div>
```

**Design Details:**
- **Vertical Spacing**: `space-y-4` creates consistent gaps
- **Separator**: Visual divider between table and pagination
- **Table Structure**: Standard HTML table with semantic markup

### TanStack Table Configuration
```tsx
const table = useReactTable({
  data: customers,
  columns,
  state: {
    sorting,
    pagination,
  },
  pageCount,
  onSortingChange: onSort,
  onPaginationChange: onPaginationChange,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  manualPagination: true,
  manualSorting: true,
});
```

**Design Details:**
- **Manual Control**: `manualPagination` and `manualSorting` for server-side control
- **State Management**: Centralized sorting and pagination state
- **Row Models**: Core and sorted row models for efficient rendering

## Column Definitions & Cell Rendering

### Column Structure Pattern
```tsx
{
  accessorKey: "customerNumber",
  header: "Customer ID",
  cell: ({ row }) => (
    <div className="font-medium">{row.getValue("customerNumber")}</div>
  ),
}
```

**Design Details:**
- **Accessor Pattern**: Uses `accessorKey` for type-safe data access
- **Header Text**: Clear, descriptive column headers
- **Cell Rendering**: Custom cell components for complex layouts

### Complex Cell Layouts
```tsx
{
  accessorKey: "fullName",
  header: "Contact",
  cell: ({ row }) => (
    <div className="flex flex-col">
      <span>{row.getValue("fullName")}</span>
      <span className="text-sm text-muted-foreground">
        {row.original.email}
      </span>
    </div>
  ),
}
```

**Design Details:**
- **Stacked Layout**: `flex flex-col` for vertical stacking
- **Typography Hierarchy**: Primary text with secondary muted text
- **Data Access**: Uses both `getValue()` and `row.original` for different data types

### Status Badge Design
```tsx
export const statusColors: Record<CustomerStatus, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  blocked: "bg-red-100 text-red-800",
};

// In cell renderer:
<Badge className={statusColors[status]}>
  {status.charAt(0).toUpperCase() + status.slice(1)}
</Badge>
```

**Design Details:**
- **Color System**: Semantic colors with proper contrast ratios
- **Badge Styling**: Pill-shaped badges with background and text colors
- **Text Capitalization**: Proper case formatting for display

### Currency Formatting
```tsx
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};
```

**Design Details:**
- **Internationalization**: Uses `Intl.NumberFormat` for locale-aware formatting
- **Currency Display**: Proper currency symbol and decimal formatting
- **Type Safety**: Number input with proper formatting output

## Header Cell Design

### Sortable Header Structure
```tsx
<TableHead className="whitespace-nowrap">
  {header.isPlaceholder ? null : (
    <div
      className={cn(
        "flex items-center gap-1",
        isSortable && "cursor-pointer select-none hover:text-foreground"
      )}
      onClick={
        isSortable ? header.column.getToggleSortingHandler() : undefined
      }
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {isSortable && (
        <div className="flex h-4 w-4 items-center justify-center">
          {/* Sort Icons */}
        </div>
      )}
    </div>
  )}
</TableHead>
```

**Design Details:**
- **Interactive States**: Hover effects for sortable columns
- **Icon Container**: Fixed `h-4 w-4` container for consistent icon sizing
- **Cursor Feedback**: `cursor-pointer` for sortable columns
- **Text Selection**: `select-none` prevents text selection on click

### Sort Icon States
```tsx
{isSortable && (
  <div className="flex h-4 w-4 items-center justify-center">
    {sorted === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : sorted === "desc" ? (
      <ArrowDown className="h-3.5 w-3.5" />
    ) : (
      <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
    )}
  </div>
)}
```

**Design Details:**
- **Icon Sizing**: `h-3.5 w-3.5` (14px) for subtle appearance
- **State Indicators**: Clear visual feedback for sort direction
- **Default State**: `opacity-50` for unsorted state
- **Icon Choice**: Lucide React icons for consistency

## Pagination System

### Pagination Container Layout
```tsx
<div className="flex flex-col items-center justify-between gap-2 gap-y-4 px-2 md:flex-row">
  {/* Rows per page */}
  {/* Total count */}
  {/* Navigation controls */}
</div>
```

**Design Details:**
- **Responsive Layout**: Stacked on mobile, row on desktop
- **Alignment**: `justify-between` for proper spacing
- **Gap System**: `gap-2` for tight spacing, `gap-y-4` for vertical gaps
- **Padding**: `px-2` for horizontal spacing

### Rows Per Page Selector
```tsx
<div className="flex w-full items-center space-x-2 md:w-auto">
  <p className="text-sm font-medium">Rows per page</p>
  <Select
    value={`${table.getState().pagination.pageSize}`}
    onValueChange={(value) => {
      table.setPageSize(Number(value));
    }}
  >
    <SelectTrigger className="h-8 w-[70px]">
      <SelectValue placeholder={table.getState().pagination.pageSize} />
    </SelectTrigger>
    <SelectContent side="top">
      {[10, 20, 30, 40, 50].map((pageSize) => (
        <SelectItem key={pageSize} value={`${pageSize}`}>
          {pageSize}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

**Design Details:**
- **Compact Design**: `h-8` height for smaller footprint
- **Fixed Width**: `w-[70px]` for consistent sizing
- **Top Positioning**: `side="top"` prevents overflow issues
- **Standard Options**: Common page size options

### Navigation Controls
```tsx
<div className="flex items-center space-x-2">
  <Button
    variant="outline"
    onClick={() => table.setPageIndex(0)}
    disabled={!table.getCanPreviousPage()}
  >
    <span className="sr-only">Go to first page</span>
    <ChevronsLeft className="size-4" />
    <span className="hidden md:block">First</span>
  </Button>
  {/* Previous, Next, Last buttons */}
</div>
```

**Design Details:**
- **Button Variants**: `variant="outline"` for subtle appearance
- **Icon + Text**: Icons with responsive text labels
- **Accessibility**: `sr-only` labels for screen readers
- **Responsive Text**: Hidden on mobile, visible on desktop
- **Disabled States**: Proper disabled styling for edge cases

### Page Information Display
```tsx
<div className="flex items-center justify-center text-sm font-medium">
  Page {table.getState().pagination.pageIndex + 1} of{" "}
  {table.getPageCount()}
</div>
```

**Design Details:**
- **Typography**: `text-sm font-medium` for readability
- **Page Calculation**: 1-based display with 0-based index
- **Total Pages**: Shows current page and total pages

## Data Management & State

### Filter State Structure
```tsx
interface CustomerFilters {
  status: CustomerStatus | 'all';
  search: string;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
}
```

**Design Details:**
- **Union Types**: `'all'` option for "show all" functionality
- **Optional Dates**: `undefined` for unselected date ranges
- **Type Safety**: Proper TypeScript interfaces

### Sorting State
```tsx
const [sorting, setSorting] = useState<SortingState>([
  { id: "dateJoined", desc: true },
]);
```

**Design Details:**
- **Default Sort**: Initial sort by join date, descending
- **Multi-sort Support**: Array structure for multiple sort criteria
- **TanStack Integration**: Compatible with table library

### Pagination State
```tsx
const [pagination, setPagination] = useState<PaginationState>({
  pageIndex: 0,
  pageSize: 10,
});
```

**Design Details:**
- **Zero-based Index**: Standard pagination indexing
- **Default Page Size**: 10 items per page
- **State Reset**: Resets to page 0 when filters change

### Data Filtering Logic
```tsx
const filteredCustomers = useMemo(() => {
  return initialCustomers.filter((customer) => {
    // Status filter
    if (filters.status !== "all" && customer.status !== filters.status) {
      return false;
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableFields = [
        customer.customerNumber,
        customer.fullName,
        customer.email,
        customer.company,
        customer.location,
      ].map((field) => field.toLowerCase());

      if (!searchableFields.some((field) => field.includes(searchLower))) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      const customerJoinDate = new Date(customer.dateJoined);
      if (filters.dateRange.from && customerJoinDate < filters.dateRange.from) {
        return false;
      }
      if (filters.dateRange.to && customerJoinDate > filters.dateRange.to) {
        return false;
      }
    }

    return true;
  });
}, [initialCustomers, filters]);
```

**Design Details:**
- **Memoization**: `useMemo` for performance optimization
- **Multi-field Search**: Searches across multiple customer fields
- **Case Insensitive**: Lowercase comparison for better UX
- **Date Range Logic**: Proper date comparison with optional bounds

## Styling & Design Patterns

### Color System
- **Primary Text**: Default text color
- **Muted Text**: `text-muted-foreground` for secondary information
- **Status Colors**: Semantic colors for different states
- **Border Colors**: Consistent border styling throughout

### Spacing System
- **4-unit Base**: `gap-4`, `p-4` for consistent spacing
- **Responsive Gaps**: Different gaps for mobile vs desktop
- **Tight Spacing**: `gap-2` for compact elements
- **Section Spacing**: `space-y-4` for vertical sections

### Typography Hierarchy
- **Page Title**: `text-2xl font-bold tracking-tight`
- **Column Headers**: Default font weight
- **Cell Text**: Default with `font-medium` for emphasis
- **Secondary Text**: `text-sm text-muted-foreground`

### Interactive States
- **Hover Effects**: Subtle color changes on interactive elements
- **Focus States**: Proper focus indicators for accessibility
- **Disabled States**: Clear visual feedback for disabled elements
- **Loading States**: Consider loading indicators for async operations

## Responsive Design Considerations

### Mobile-First Approach
- **Stacked Layout**: Filters stack vertically on mobile
- **Full Width**: Search and filters take full width on mobile
- **Hidden Elements**: Some text labels hidden on mobile
- **Touch Targets**: Adequate touch target sizes

### Breakpoint Strategy
- **Mobile**: `< 768px` - Stacked layout
- **Tablet**: `768px - 1024px` - Mixed layout
- **Desktop**: `> 1024px` - Full horizontal layout

### Responsive Patterns
```tsx
// Responsive width classes
className="w-full md:w-[180px]"

// Responsive flex direction
className="flex flex-col lg:flex-row"

// Responsive text visibility
className="hidden md:block"
```

## Implementation Checklist

### Core Components
- [ ] Main page container with proper layout
- [ ] Table card with border and background
- [ ] Filter section with search, dropdown, and date picker
- [ ] Table with sortable headers
- [ ] Pagination with navigation controls
- [ ] Empty state for no results

### State Management
- [ ] Filter state with proper TypeScript types
- [ ] Sorting state with TanStack Table integration
- [ ] Pagination state with page size controls
- [ ] Data filtering logic with memoization
- [ ] State update handlers with proper typing

### Styling & Design
- [ ] Consistent spacing system
- [ ] Color system for status indicators
- [ ] Typography hierarchy
- [ ] Interactive states and hover effects
- [ ] Responsive design patterns

### Accessibility
- [ ] Proper ARIA labels
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Focus management
- [ ] Color contrast compliance

### Performance
- [ ] Memoized filtering logic
- [ ] Efficient re-rendering
- [ ] Proper data structure
- [ ] Optimized component structure

This implementation provides a robust, scalable foundation for data tables that can be easily adapted for different data types and use cases while maintaining consistent design patterns and user experience.

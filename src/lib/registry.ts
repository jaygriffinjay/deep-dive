/**
 * Component Registry
 *
 * Single source of truth for all available components in this project.
 * Used by AI agents, documentation generators, and potentially runtime APIs.
 *
 * Convention:
 * - `from`: the import path
 * - `exports`: named exports available from that path
 * - `description`: what the component does (for AI context)
 * - `props`: key props worth knowing about (not exhaustive — all accept className)
 */

export const REGISTRY = {
  // ─── Typography: Headings ─────────────────────────────────────────
  H1: {
    from: "@/components/typography",
    description: "<h1> tag. Override via className or style.",
    props: ["className", "id", "style"],
  },
  H2: {
    from: "@/components/typography",
    description: "<h2> tag. Override via className or style.",
    props: ["className", "id", "style"],
  },
  H3: {
    from: "@/components/typography",
    description: "<h3> tag. Override via className or style.",
    props: ["className", "id", "style"],
  },
  H4: {
    from: "@/components/typography",
    description: "<h4> tag. Override via className or style.",
    props: ["className", "id", "style"],
  },
  H5: {
    from: "@/components/typography",
    description: "<h5> tag. Override via className or style.",
    props: ["className", "id", "style"],
  },
  H6: {
    from: "@/components/typography",
    description: "<h6> tag. Override via className or style.",
    props: ["className", "id", "style"],
  },

  // ─── Typography: Inline Decorators ────────────────────────────────
  Bold: {
    from: "@/components/typography",
    description: "<strong> tag. Font-bold.",
    props: ["className"],
  },
  Italic: {
    from: "@/components/typography",
    description: "<em> tag. Italic.",
    props: ["className"],
  },
  Underline: {
    from: "@/components/typography",
    description: "<span> with underline. Not for navigation — use Link.",
    props: ["className"],
  },
  Strikethrough: {
    from: "@/components/typography",
    description: "<s> tag. Line-through.",
    props: ["className"],
  },
  Highlight: {
    from: "@/components/typography",
    description:
      "<mark> tag. bg-primary/20 background. Override color via className.",
    props: ["className"],
  },
  InlineCode: {
    from: "@/components/typography",
    description: "<code> tag",
    props: ["className", "style"],
  },
  Small: {
    from: "@/components/typography",
    description: "<small> tag",
    props: ["className", "style"],
  },

  //Typography: Block-Level
  Paragraph: {
    from: "@/components/typography",
    description: "<p> tag.",
    props: ["className", "style"],
  },
  Text: {
    from: "@/components/typography",
    description: "<span> with no default styles. For inline fragments.",
    props: ["className", "style"],
  },
  Blockquote: {
    from: "@/components/typography",
    description: "<blockquote> tag.",
    props: ["className", "style"],
  },
  List: {
    from: "@/components/typography",
    description: "<ul> or <ol>. Pass ordered prop for numbered list.",
    props: ["ordered", "className"],
  },
  ListItem: {
    from: "@/components/typography",
    description: "<li> tag. Use inside List.",
    props: ["className"],
  },
  Link: {
    from: "@/components/typography",
    description: 'Next.js Link wrapper. Use target="_blank" for new tab.',
    props: ["href", "target", "className"],
  },

  // ─── shadcn/ui ────────────────────────────────────────────────────
  Accordion: {
    from: "@/components/ui/accordion",
    exports: [
      "Accordion",
      "AccordionItem",
      "AccordionTrigger",
      "AccordionContent",
    ],
    description: "Expandable/collapsible sections.",
  },
  Alert: {
    from: "@/components/ui/alert",
    exports: ["Alert", "AlertTitle", "AlertDescription"],
    description: "Callout for info, success, warning, error messages.",
  },
  AlertDialog: {
    from: "@/components/ui/alert-dialog",
    exports: [
      "AlertDialog",
      "AlertDialogTrigger",
      "AlertDialogContent",
      "AlertDialogHeader",
      "AlertDialogFooter",
      "AlertDialogTitle",
      "AlertDialogDescription",
      "AlertDialogAction",
      "AlertDialogCancel",
    ],
    description: "Modal dialog requiring user confirmation.",
  },
  AspectRatio: {
    from: "@/components/ui/aspect-ratio",
    exports: ["AspectRatio"],
    description: "Constrains child to a given aspect ratio.",
  },
  Avatar: {
    from: "@/components/ui/avatar",
    exports: ["Avatar", "AvatarImage", "AvatarFallback"],
    description: "User avatar with image and fallback.",
  },
  Badge: {
    from: "@/components/ui/badge",
    exports: ["Badge", "badgeVariants"],
    description:
      "Small status label. Variants: default, secondary, destructive, outline.",
  },
  Breadcrumb: {
    from: "@/components/ui/breadcrumb",
    exports: [
      "Breadcrumb",
      "BreadcrumbList",
      "BreadcrumbItem",
      "BreadcrumbLink",
      "BreadcrumbPage",
      "BreadcrumbSeparator",
      "BreadcrumbEllipsis",
    ],
    description: "Navigation breadcrumb trail.",
  },
  Button: {
    from: "@/components/ui/button",
    exports: ["Button", "buttonVariants"],
    description:
      "Button. Variants: default, destructive, outline, secondary, ghost, link. Sizes: default, sm, lg, icon.",
  },
  Calendar: {
    from: "@/components/ui/calendar",
    exports: ["Calendar"],
    description: "Date picker calendar.",
  },
  Card: {
    from: "@/components/ui/card",
    exports: [
      "Card",
      "CardHeader",
      "CardFooter",
      "CardTitle",
      "CardDescription",
      "CardContent",
    ],
    description: "Container card with header, content, footer.",
  },
  Carousel: {
    from: "@/components/ui/carousel",
    exports: [
      "Carousel",
      "CarouselContent",
      "CarouselItem",
      "CarouselPrevious",
      "CarouselNext",
    ],
    description: "Horizontal scrollable carousel.",
  },
  Chart: {
    from: "@/components/ui/chart",
    exports: [
      "ChartContainer",
      "ChartTooltip",
      "ChartTooltipContent",
      "ChartLegend",
      "ChartLegendContent",
    ],
    description: "Chart wrapper for Recharts with theme support.",
  },
  Checkbox: {
    from: "@/components/ui/checkbox",
    exports: ["Checkbox"],
    description: "Checkbox input.",
  },
  Collapsible: {
    from: "@/components/ui/collapsible",
    exports: ["Collapsible", "CollapsibleTrigger", "CollapsibleContent"],
    description: "Toggle content visibility.",
  },
  Command: {
    from: "@/components/ui/command",
    exports: [
      "Command",
      "CommandInput",
      "CommandList",
      "CommandEmpty",
      "CommandGroup",
      "CommandItem",
      "CommandSeparator",
      "CommandShortcut",
    ],
    description: "Command palette / search input with results.",
  },
  ContextMenu: {
    from: "@/components/ui/context-menu",
    exports: [
      "ContextMenu",
      "ContextMenuTrigger",
      "ContextMenuContent",
      "ContextMenuItem",
      "ContextMenuSeparator",
      "ContextMenuCheckboxItem",
      "ContextMenuRadioGroup",
      "ContextMenuRadioItem",
      "ContextMenuLabel",
      "ContextMenuShortcut",
      "ContextMenuSub",
      "ContextMenuSubTrigger",
      "ContextMenuSubContent",
    ],
    description: "Right-click context menu.",
  },
  Dialog: {
    from: "@/components/ui/dialog",
    exports: [
      "Dialog",
      "DialogTrigger",
      "DialogContent",
      "DialogHeader",
      "DialogFooter",
      "DialogTitle",
      "DialogDescription",
      "DialogClose",
    ],
    description: "Modal dialog overlay.",
  },
  Drawer: {
    from: "@/components/ui/drawer",
    exports: [
      "Drawer",
      "DrawerTrigger",
      "DrawerContent",
      "DrawerHeader",
      "DrawerFooter",
      "DrawerTitle",
      "DrawerDescription",
      "DrawerClose",
    ],
    description: "Slide-in drawer panel.",
  },
  DropdownMenu: {
    from: "@/components/ui/dropdown-menu",
    exports: [
      "DropdownMenu",
      "DropdownMenuTrigger",
      "DropdownMenuContent",
      "DropdownMenuItem",
      "DropdownMenuCheckboxItem",
      "DropdownMenuRadioItem",
      "DropdownMenuLabel",
      "DropdownMenuSeparator",
      "DropdownMenuShortcut",
      "DropdownMenuGroup",
      "DropdownMenuSub",
      "DropdownMenuSubContent",
      "DropdownMenuSubTrigger",
      "DropdownMenuRadioGroup",
    ],
    description: "Dropdown menu triggered by a button.",
  },
  Form: {
    from: "@/components/ui/form",
    exports: [
      "Form",
      "FormField",
      "FormItem",
      "FormLabel",
      "FormControl",
      "FormDescription",
      "FormMessage",
    ],
    description: "Form wrapper with react-hook-form + zod validation.",
  },
  HoverCard: {
    from: "@/components/ui/hover-card",
    exports: ["HoverCard", "HoverCardTrigger", "HoverCardContent"],
    description: "Card that appears on hover.",
  },
  Input: {
    from: "@/components/ui/input",
    exports: ["Input"],
    description: "Text input field.",
  },
  InputOTP: {
    from: "@/components/ui/input-otp",
    exports: ["InputOTP", "InputOTPGroup", "InputOTPSlot", "InputOTPSeparator"],
    description: "One-time password input with slots.",
  },
  Kbd: {
    from: "@/components/ui/kbd",
    exports: ["Kbd", "KbdGroup"],
    description: "Keyboard shortcut display.",
  },
  Label: {
    from: "@/components/ui/label",
    exports: ["Label"],
    description: "Form label. Links to input via htmlFor.",
  },
  Menubar: {
    from: "@/components/ui/menubar",
    exports: [
      "Menubar",
      "MenubarMenu",
      "MenubarTrigger",
      "MenubarContent",
      "MenubarItem",
      "MenubarSeparator",
      "MenubarLabel",
      "MenubarCheckboxItem",
      "MenubarRadioGroup",
      "MenubarRadioItem",
      "MenubarShortcut",
      "MenubarSub",
      "MenubarSubTrigger",
      "MenubarSubContent",
    ],
    description: "Horizontal menu bar (like OS menu bars).",
  },
  NavigationMenu: {
    from: "@/components/ui/navigation-menu",
    exports: [
      "NavigationMenu",
      "NavigationMenuList",
      "NavigationMenuItem",
      "NavigationMenuTrigger",
      "NavigationMenuContent",
      "NavigationMenuLink",
      "NavigationMenuIndicator",
      "NavigationMenuViewport",
    ],
    description: "Site navigation with dropdowns.",
  },
  Pagination: {
    from: "@/components/ui/pagination",
    exports: [
      "Pagination",
      "PaginationContent",
      "PaginationItem",
      "PaginationLink",
      "PaginationPrevious",
      "PaginationNext",
      "PaginationEllipsis",
    ],
    description: "Page navigation controls.",
  },
  Popover: {
    from: "@/components/ui/popover",
    exports: ["Popover", "PopoverTrigger", "PopoverContent"],
    description: "Floating popover panel triggered by click.",
  },
  Progress: {
    from: "@/components/ui/progress",
    exports: ["Progress"],
    description: "Progress bar. Set value 0-100.",
  },
  RadioGroup: {
    from: "@/components/ui/radio-group",
    exports: ["RadioGroup", "RadioGroupItem"],
    description: "Radio button group.",
  },
  Resizable: {
    from: "@/components/ui/resizable",
    exports: ["ResizableHandle", "ResizablePanel", "ResizablePanelGroup"],
    description: "Resizable split panels.",
  },
  ScrollArea: {
    from: "@/components/ui/scroll-area",
    exports: ["ScrollArea", "ScrollBar"],
    description: "Custom scrollable area with styled scrollbar.",
  },
  Select: {
    from: "@/components/ui/select",
    exports: [
      "Select",
      "SelectTrigger",
      "SelectValue",
      "SelectContent",
      "SelectGroup",
      "SelectItem",
      "SelectLabel",
      "SelectSeparator",
    ],
    description: "Dropdown select input.",
  },
  Separator: {
    from: "@/components/ui/separator",
    exports: ["Separator"],
    description: "Horizontal or vertical divider line. Props: orientation.",
  },
  Sheet: {
    from: "@/components/ui/sheet",
    exports: [
      "Sheet",
      "SheetTrigger",
      "SheetContent",
      "SheetHeader",
      "SheetFooter",
      "SheetTitle",
      "SheetDescription",
      "SheetClose",
    ],
    description: "Slide-in panel from edge of screen.",
  },
  Sidebar: {
    from: "@/components/ui/sidebar",
    exports: [
      "Sidebar",
      "SidebarContent",
      "SidebarFooter",
      "SidebarGroup",
      "SidebarGroupContent",
      "SidebarGroupLabel",
      "SidebarHeader",
      "SidebarMenu",
      "SidebarMenuButton",
      "SidebarMenuItem",
      "SidebarProvider",
      "SidebarTrigger",
    ],
    description: "Application sidebar with collapsible sections.",
  },
  Skeleton: {
    from: "@/components/ui/skeleton",
    exports: ["Skeleton"],
    description: "Loading placeholder animation.",
  },
  Slider: {
    from: "@/components/ui/slider",
    exports: ["Slider"],
    description: "Range slider input.",
  },
  Sonner: {
    from: "@/components/ui/sonner",
    exports: ["Toaster"],
    description: "Toast notification system. Use toast() function to trigger.",
  },
  Spinner: {
    from: "@/components/ui/spinner",
    exports: ["Spinner"],
    description: "Loading spinner animation.",
  },
  Switch: {
    from: "@/components/ui/switch",
    exports: ["Switch"],
    description: "Toggle switch input.",
  },
  Table: {
    from: "@/components/ui/table",
    exports: [
      "Table",
      "TableHeader",
      "TableBody",
      "TableFooter",
      "TableHead",
      "TableRow",
      "TableCell",
      "TableCaption",
    ],
    description: "Data table with header, body, footer.",
  },
  Tabs: {
    from: "@/components/ui/tabs",
    exports: ["Tabs", "TabsList", "TabsTrigger", "TabsContent"],
    description: "Tabbed content panels.",
  },
  Textarea: {
    from: "@/components/ui/textarea",
    exports: ["Textarea"],
    description: "Multi-line text input.",
  },
  Toggle: {
    from: "@/components/ui/toggle",
    exports: ["Toggle", "toggleVariants"],
    description: "Toggle button. Variants: default, outline.",
  },
  ToggleGroup: {
    from: "@/components/ui/toggle-group",
    exports: ["ToggleGroup", "ToggleGroupItem"],
    description: "Group of toggle buttons. Single or multiple selection.",
  },
  Tooltip: {
    from: "@/components/ui/tooltip",
    exports: ["Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider"],
    description:
      "Hover tooltip. TooltipProvider must wrap app (already in layout.tsx).",
  },
  ButtonGroup: {
    from: "@/components/ui/button-group",
    exports: [
      "ButtonGroup",
      "ButtonGroupText",
      "ButtonGroupSeparator",
      "buttonGroupVariants",
    ],
    description:
      "Joins buttons/inputs into a connected control. Orientations: horizontal, vertical.",
  },
  Combobox: {
    from: "@/components/ui/combobox",
    exports: [
      "Combobox",
      "ComboboxInput",
      "ComboboxContent",
      "ComboboxList",
      "ComboboxItem",
      "ComboboxGroup",
      "ComboboxLabel",
      "ComboboxCollection",
      "ComboboxEmpty",
      "ComboboxSeparator",
      "ComboboxChips",
      "ComboboxChip",
      "ComboboxChipsInput",
      "ComboboxTrigger",
      "ComboboxValue",
      "useComboboxAnchor",
    ],
    description:
      "Searchable select built on Base UI. Supports single and multi-select (chip mode).",
  },
  Empty: {
    from: "@/components/ui/empty",
    exports: [
      "Empty",
      "EmptyHeader",
      "EmptyTitle",
      "EmptyDescription",
      "EmptyContent",
      "EmptyMedia",
    ],
    description:
      "Empty state layout. Compose with EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent.",
  },
  Field: {
    from: "@/components/ui/field",
    exports: [
      "Field",
      "FieldLabel",
      "FieldDescription",
      "FieldError",
      "FieldGroup",
      "FieldLegend",
      "FieldSeparator",
      "FieldSet",
      "FieldContent",
      "FieldTitle",
    ],
    description:
      "Form field layout. Wraps label, input, description, error. Orientations: vertical, horizontal, responsive.",
  },
  InputGroup: {
    from: "@/components/ui/input-group",
    exports: [
      "InputGroup",
      "InputGroupAddon",
      "InputGroupButton",
      "InputGroupText",
      "InputGroupInput",
      "InputGroupTextarea",
    ],
    description:
      "Input with addons. InputGroupAddon align: inline-start, inline-end, block-start, block-end.",
  },
  Item: {
    from: "@/components/ui/item",
    exports: [
      "Item",
      "ItemMedia",
      "ItemContent",
      "ItemActions",
      "ItemGroup",
      "ItemSeparator",
      "ItemTitle",
      "ItemDescription",
      "ItemHeader",
      "ItemFooter",
    ],
    description:
      "List row layout. Compose with ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions. Wrap in ItemGroup.",
  },
  NativeSelect: {
    from: "@/components/ui/native-select",
    exports: ["NativeSelect", "NativeSelectOption", "NativeSelectOptGroup"],
    description:
      "Native <select> with styling. Sizes: default, sm. Simpler alternative to Select.",
  },

  // ─── Layout ───────────────────────────────────────────────────────
  Container: {
    from: "@/components/layout/Container",
    description:
      "Centered max-width content container. Defaults to max-w-xl (576px) with standard page margins (mt-16, mb-80). Override width or margins via className.",
    props: ["className"],
  },

  // ─── Utilities ────────────────────────────────────────────────────
  cn: {
    from: "@/lib/utils",
    description:
      "clsx + tailwind-merge. Use for all conditional/dynamic classes.",
  },
  ModeToggle: {
    from: "@/components/mode-toggle",
    description: "Light/Dark/System theme switcher dropdown button.",
  },
} as const;

export type ComponentName = keyof typeof REGISTRY;

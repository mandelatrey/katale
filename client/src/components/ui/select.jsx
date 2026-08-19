import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from '../Icons';
import { cn } from '../../lib/utils';

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'group flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg border border-[#e5e7eb] bg-white pl-3.5 pr-3 py-2 text-[13px] font-semibold tracking-[-0.01em] text-[#111827] outline-none transition-all',
        'shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-[#d1d5db]',
        'focus:border-[#1a6b30] focus:ring-[3px] focus:ring-[#1a6b30]/15',
        'data-[state=open]:border-[#1a6b30] data-[state=open]:ring-[3px] data-[state=open]:ring-[#1a6b30]/15',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'placeholder:text-[#9ca3af]',
        className
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#6b7280] transition-transform duration-150 group-data-[state=open]:rotate-180 group-data-[state=open]:text-[#1a6b30]" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef(
  ({ className, children, position = 'popper', ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          'z-[3100] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[#e5e7eb] bg-white text-[#111827]',
          'shadow-[0_12px_32px_-8px_rgba(15,23,42,0.14),0_4px_8px_-4px_rgba(15,23,42,0.06)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        position={position}
        sideOffset={6}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1 text-[#6b7280]">
          <ChevronUp className="h-3.5 w-3.5" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1.5">
          {children}
        </SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1 text-[#6b7280]">
          <ChevronDown className="h-3.5 w-3.5" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
);
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef(
  ({ className, ...props }, ref) => (
    <SelectPrimitive.Label
      ref={ref}
      className={cn(
        'mx-1 mt-0.5 mb-1.5 border-b border-[#f3f4f6] px-2.5 pt-1.5 pb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#6b7280]',
        className
      )}
      {...props}
    />
  )
);
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef(
  ({ className, children, icon, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-md pl-2.5 pr-9 py-1.5 text-[13px] font-medium text-[#374151] outline-none transition-colors',
        'hover:bg-[#f9fafb] hover:text-[#111827]',
        'focus:bg-[#f3f4f6] focus:text-[#111827]',
        'data-[state=checked]:bg-[#e6f2ea] data-[state=checked]:font-semibold data-[state=checked]:tracking-[-0.01em] data-[state=checked]:text-[#0d3b1a]',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    >
      {icon && (
        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[#1a6b30]">
          {icon}
        </span>
      )}
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <span className="absolute right-3 flex h-4 w-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-3.5 w-3.5 text-[#1a6b30]" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  )
);
SelectItem.displayName = SelectPrimitive.Item.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
};


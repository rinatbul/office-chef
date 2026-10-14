import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

export const Select = ({ children, ...props }) => {
  return <SelectPrimitive.Root {...props}>{children}</SelectPrimitive.Root>
}

export const SelectValue = ({ className = '', ...props }) => {
  return (
    <SelectPrimitive.Value
      className={`ui-select__value${className ? ` ${className}` : ''}`}
      {...props}
    />
  )
}

export const SelectTrigger = ({ className = '', children, ...props }) => {
  return (
    <SelectPrimitive.Trigger
      className={`ui-select__trigger${className ? ` ${className}` : ''}`}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="ui-select__icon" size={18} aria-hidden="true" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export const SelectContent = ({
  className = '',
  children,
  position = 'popper',
  ...props
}) => {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className={`ui-select__content${className ? ` ${className}` : ''}`}
        position={position}
        {...props}
      >
        <SelectPrimitive.Viewport className="ui-select__viewport">
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export const SelectItem = ({ className = '', children, ...props }) => {
  return (
    <SelectPrimitive.Item
      className={`ui-select__item${className ? ` ${className}` : ''}`}
      {...props}
    >
      <span className="ui-select__item-indicator">
        <SelectPrimitive.ItemIndicator>
          <Check size={16} aria-hidden="true" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

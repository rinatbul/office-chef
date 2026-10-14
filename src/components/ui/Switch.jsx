import * as SwitchPrimitive from '@radix-ui/react-switch'

export const Switch = ({
  className = '',
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  id,
  name,
  ...props
}) => {
  return (
    <SwitchPrimitive.Root
      id={id}
      name={name}
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`ui-switch${className ? ` ${className}` : ''}`}
      {...props}
    >
      <SwitchPrimitive.Thumb className="ui-switch__thumb" />
    </SwitchPrimitive.Root>
  )
}

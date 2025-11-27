import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { useRules } from '@/hooks/useRules';

interface RuleMultiSelectProps {
  ruleSet: string;
  value: string[];
  onChange: (rules: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function RuleMultiSelect({
  ruleSet,
  value,
  onChange,
  disabled = false,
  placeholder = 'Select rules...',
}: RuleMultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const { rules, loading, error } = useRules({
    ruleSet,
    enabled: !!ruleSet,
  });

  const handleToggleRule = (ruleName: string, ruleEnabled: boolean) => {
    // Don't allow selecting disabled rules
    if (!ruleEnabled) return;

    if (value.includes(ruleName)) {
      onChange(value.filter(r => r !== ruleName));
    } else {
      onChange([...value, ruleName]);
    }
  };

  const displayText = React.useMemo(() => {
    if (!ruleSet) return 'Select a rule set first';
    if (loading) return 'Loading rules...';
    if (error) return 'Failed to load rules';
    if (value.length === 0) return placeholder;
    if (value.length === 1) return `${value.length} rule selected`;
    return `${value.length} rules selected`;
  }, [ruleSet, loading, error, value.length, placeholder]);

  return (
    <div className="relative w-full">
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="w-full justify-between"
        disabled={disabled || !ruleSet || loading}
        style={{
          borderColor: 'var(--color-border)',
          fontSize: '14px',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
        }}
      >
        <span className="truncate">{displayText}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {open && (
        <>
          {/* Backdrop to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown menu */}
          <div
            className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              maxHeight: '300px',
              overflowY: 'auto'
            }}
          >
            <Command>
              <CommandInput placeholder="Search rules..." />
              <CommandList>
                <CommandEmpty>
                  {loading ? 'Loading...' : rules.length === 0 ? 'No rules available for this rule set' : 'No rules found'}
                </CommandEmpty>
                <CommandGroup>
                  {rules.map((rule) => {
                    const isSelected = value.includes(rule.ruleName);
                    const isDisabled = !rule.enabled;

                    return (
                      <CommandItem
                        key={rule.ruleId}
                        value={rule.ruleName}
                        onSelect={() => handleToggleRule(rule.ruleName, rule.enabled)}
                        disabled={isDisabled}
                        className={cn(
                          'flex items-center gap-2 cursor-pointer',
                          isDisabled && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <Checkbox
                          checked={isSelected}
                          disabled={isDisabled}
                          className="pointer-events-none"
                        />
                        <span className={cn(
                          'flex-1',
                          isDisabled && 'line-through'
                        )}>
                          {rule.ruleName}
                        </span>
                        {isDisabled && (
                          <span className="text-xs text-muted-foreground">(disabled)</span>
                        )}
                        {isSelected && !isDisabled && (
                          <Check className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </>
      )}
    </div>
  );
}

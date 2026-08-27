import { Badge } from './ui';
import { titleCase } from '../lib/format';
import type { GraphNode } from '../lib/types';

const TYPE_TONE = {
  service: 'info',
  transport: 'brand',
  attraction: 'warn',
  destination: 'neutral',
} as const;

/**
 * Lets the user choose which node to treat as disrupted. Every
 * impact/ripple/intervention screen starts from this choice, so it lives
 * in one component rather than being re-implemented per page.
 */
export function NodePicker({
  nodes,
  value,
  onChange,
  label = 'Disrupted node',
  hint,
}: {
  nodes: GraphNode[];
  value: string | null;
  onChange: (nodeId: string) => void;
  label?: string;
  hint?: string;
}) {
  const grouped = nodes.reduce<Record<string, GraphNode[]>>((acc, node) => {
    (acc[node.type] ??= []).push(node);
    return acc;
  }, {});

  return (
    <div>
      <label
        htmlFor="node-picker"
        className="mb-1.5 block text-xs font-semibold text-mist-300"
      >
        {label}
      </label>
      <select
        id="node-picker"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-line bg-ink-850 px-3.5 py-2.5 text-sm text-mist-100 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      >
        <option value="" disabled>
          Choose a node…
        </option>
        {Object.entries(grouped).map(([type, items]) => (
          <optgroup key={type} label={titleCase(type)}>
            {items.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {hint && <p className="mt-1.5 text-[11px] text-mist-500">{hint}</p>}
    </div>
  );
}

export function NodeChip({
  node,
  depth,
}: {
  node: { id: string; label: string };
  depth?: number;
}) {
  const type = node.id.split(':')[0] as keyof typeof TYPE_TONE;

  return (
    <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-ink-850 px-2.5 py-1.5">
      <Badge tone={TYPE_TONE[type] ?? 'neutral'} className="!px-1.5 !py-0.5">
        {titleCase(type ?? 'node')}
      </Badge>
      <span className="text-[12px] font-medium text-mist-100">{node.label}</span>
      {depth !== undefined && (
        <span className="font-mono text-[10px] text-mist-500">d{depth}</span>
      )}
    </span>
  );
}

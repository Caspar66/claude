import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PlatformRow } from './PlatformRow';
import { cn } from '@/lib/utils';
import type { Entity, EntityOwner } from '@/types/domain';

// ── Cascading Add Existing Menu ────────────────────────────────────────────────

const PLAN_TYPES = [
  { label: 'Super Plan', planType: 'Super' },
  { label: 'Pension Plan', planType: 'Pension' },
  { label: 'Investment Platform', planType: 'Investment' },
] as const;

const OTHER_ASSETS = [
  'Investments - Bonds',
  'Investments - Other Investments',
  'Investments - Stocks',
  'Investments - Unit Trusts',
  'Liquid Assets - Cash on Hand',
  'Liquid Assets - Current Savings',
  'Liquid Assets - Fixed Deposits',
] as const;

const ENTITIES: EntityOwner[] = ['Client', 'Partner', 'Joint'];

interface CascadeMenuProps {
  scenarioId: string;
  onClose: () => void;
}

function CascadeMenu({ scenarioId, onClose }: CascadeMenuProps) {
  const navigate = useNavigate();
  const [hoveredEntity, setHoveredEntity] = useState<EntityOwner | null>(null);
  const [hoveredPlanType, setHoveredPlanType] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  function handleSelect(entity: EntityOwner, planType: string) {
    onClose();
    navigate(`/scenarios/${scenarioId}/add-existing?entity=${entity}&planType=${planType}`);
  }

  const itemCls = 'flex items-center justify-between gap-4 px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 cursor-pointer whitespace-nowrap select-none';
  const headerCls = 'px-3 py-1.5 text-xs font-semibold text-gray-500 border-b border-border bg-gray-50';

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 z-50 flex shadow-lg border border-border rounded-lg overflow-hidden bg-white text-gray-900"
      style={{ minWidth: 180 }}
    >
      {/* Column 1: Entities */}
      <div className="border-r border-border">
        <div className={headerCls}>Entity</div>
        {ENTITIES.map((entity) => (
          <div
            key={entity}
            className={cn(itemCls, hoveredEntity === entity && 'bg-gray-100')}
            onMouseEnter={() => { setHoveredEntity(entity); setHoveredPlanType(null); }}
          >
            {entity}
            <ChevronRight size={12} className="text-muted-foreground" />
          </div>
        ))}
      </div>

      {/* Column 2: Plan Types — only shown when entity is hovered */}
      {hoveredEntity && (
        <div className="border-r border-border">
          <div className={headerCls}>Type</div>
          {PLAN_TYPES.map(({ label, planType }) => (
            <div
              key={planType}
              className={cn(itemCls, hoveredPlanType === planType && 'bg-gray-100')}
              onMouseEnter={() => setHoveredPlanType(planType)}
              onClick={() => handleSelect(hoveredEntity, planType)}
            >
              {label}
            </div>
          ))}
          <div
            className={cn(itemCls, hoveredPlanType === 'Other' && 'bg-gray-100')}
            onMouseEnter={() => setHoveredPlanType('Other')}
          >
            Other Assets
            <ChevronRight size={12} className="text-muted-foreground" />
          </div>
        </div>
      )}

      {/* Column 3: Other Assets sub-menu */}
      {hoveredEntity && hoveredPlanType === 'Other' && (
        <div>
          <div className={headerCls}>Category</div>
          {OTHER_ASSETS.map((asset) => (
            <div
              key={asset}
              className={itemCls}
              onClick={() => handleSelect(hoveredEntity, 'Investment')}
            >
              {asset}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Entity Group ───────────────────────────────────────────────────────────────

interface EntityGroupProps {
  label: EntityOwner;
  entity: Entity;
}

function EntityGroup({ label, entity }: EntityGroupProps) {
  const [open, setOpen] = useState(true);

  const totalBalance = entity.platforms.reduce((sum, p) => sum + p.balance, 0);

  return (
    <tbody>
      <tr className="bg-gray-50 border-b border-border">
        <td colSpan={3} className="px-3 py-1.5">
          <button
            className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-teal-700 transition-colors"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {label}
          </button>
        </td>
      </tr>

      {open &&
        entity.platforms.map((platform) => (
          <PlatformRow
            key={platform.id}
            platform={platform}
            ownerSplit={
              entity.owner === 'Joint' && entity.ownershipSplit
                ? `Partner ${entity.ownershipSplit.partner}% / Client ${entity.ownershipSplit.client}%`
                : undefined
            }
          />
        ))}

      {open && (
        <tr className="border-b border-border bg-gray-50/60">
          <td className="pl-8 pr-3 py-1.5 text-xs text-muted-foreground">{label} Total</td>
          <td />
          <td className="px-3 py-1.5 text-xs text-right font-medium tabular-nums">
            {new Intl.NumberFormat('en-AU', {
              style: 'currency',
              currency: 'AUD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(totalBalance)}
          </td>
        </tr>
      )}
    </tbody>
  );
}

// ── Section ────────────────────────────────────────────────────────────────────

interface Props {
  entities: Entity[];
  scenarioId: string;
}

export function CurrentSituationSection({ entities, scenarioId }: Props) {
  const groups: EntityOwner[] = ['Client', 'Partner', 'Joint'];
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="mb-4">
      <div className="flex items-center justify-between px-4 py-2 bg-teal-700 text-white rounded-t">
        <span className="text-sm font-semibold flex items-center gap-2">
          <Settings size={14} />
          Current Situation
        </span>
        <div className="relative">
          <Button
            size="sm"
            variant="secondary"
            className="h-7 text-xs bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={() => setMenuOpen((o) => !o)}
          >
            Add Existing <ChevronDown size={11} className="ml-1" />
          </Button>
          {menuOpen && (
            <CascadeMenu scenarioId={scenarioId} onClose={() => setMenuOpen(false)} />
          )}
        </div>
      </div>

      <div className="border border-border border-t-0 rounded-b overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-border">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Platform</th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Type</th>
              <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Account Balance</th>
            </tr>
          </thead>

          {groups.map((owner) => {
            const entity = entities.find((e) => e.owner === owner);
            if (!entity) return null;
            return <EntityGroup key={owner} label={owner} entity={entity} />;
          })}
        </table>
      </div>
    </section>
  );
}

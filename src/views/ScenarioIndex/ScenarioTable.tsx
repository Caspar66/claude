import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Pencil, Copy, FileText, Lock } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SortableColumnHeader } from '@/components/shared/SortableColumnHeader';
import { useAppContext } from '@/context/AppContext';
import { formatDate } from '@/lib/utils';
import type { Scenario, AdviserTimestamp } from '@/types/domain';

type SortColumn = 'name' | 'created' | 'lastChanged' | 'implemented' | 'locked';

function sortScenarios(
  scenarios: Scenario[],
  col: SortColumn,
  dir: 'asc' | 'desc'
): Scenario[] {
  const getVal = (s: Scenario): string => {
    const ts = (t?: AdviserTimestamp) => t?.date ?? '';
    switch (col) {
      case 'name': return s.name;
      case 'created': return ts(s.created);
      case 'lastChanged': return ts(s.lastChanged);
      case 'implemented': return ts(s.implemented);
      case 'locked': return ts(s.locked);
    }
  };
  return [...scenarios].sort((a, b) => {
    const cmp = getVal(a).localeCompare(getVal(b));
    return dir === 'asc' ? cmp : -cmp;
  });
}

function TimestampCell({ ts }: { ts?: { date: string; adviser: string } }) {
  if (!ts) return <td className="px-3 py-2 text-sm text-muted-foreground">—</td>;
  return (
    <td className="px-3 py-2 text-sm">
      <div>{formatDate(ts.date)}</div>
      <div className="text-xs text-muted-foreground">{ts.adviser}</div>
    </td>
  );
}

export function ScenarioTable() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const [sortCol, setSortCol] = useState<SortColumn>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  function handleSort(col: string) {
    const c = col as SortColumn;
    if (sortCol === c) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(c);
      setSortDir('asc');
    }
  }

  const sorted = sortScenarios(state.clientFile.scenarios, sortCol, sortDir);

  const sortProps = { currentColumn: sortCol, direction: sortDir, onSort: handleSort };

  return (
    <div className="overflow-x-auto border border-border rounded">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-border">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Actions</th>
            <SortableColumnHeader label="Scenario Name" column="name" {...sortProps} />
            <SortableColumnHeader label="Created" column="created" {...sortProps} />
            <SortableColumnHeader label="Last Changed" column="lastChanged" {...sortProps} />
            <SortableColumnHeader label="Implemented" column="implemented" {...sortProps} />
            <SortableColumnHeader label="Locked" column="locked" {...sortProps} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((scenario, idx) => (
            <tr
              key={scenario.id}
              className={`border-b border-border last:border-0 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
            >
              {/* Actions */}
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => dispatch({ type: 'DELETE_SCENARIO', id: scenario.id })}
                        className="p-1 rounded hover:bg-red-100 hover:text-red-600 text-muted-foreground transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(`/scenarios/${scenario.id}`)}
                        className="p-1 rounded hover:bg-blue-100 hover:text-blue-600 text-muted-foreground transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 rounded hover:bg-green-100 hover:text-green-600 text-muted-foreground transition-colors">
                        <Copy size={13} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 rounded hover:bg-purple-100 hover:text-purple-600 text-muted-foreground transition-colors">
                        <FileText size={13} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Document</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => dispatch({ type: 'LOCK_SCENARIO', id: scenario.id })}
                        className={`p-1 rounded transition-colors ${
                          scenario.isLocked
                            ? 'text-amber-600 hover:bg-amber-100'
                            : 'text-muted-foreground hover:bg-amber-100 hover:text-amber-600'
                        }`}
                      >
                        <Lock size={13} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>{scenario.isLocked ? 'Unlock' : 'Lock'}</TooltipContent>
                  </Tooltip>
                </div>
              </td>

              {/* Scenario Name */}
              <td className="px-3 py-2">
                <button
                  onClick={() => navigate(`/scenarios/${scenario.id}`)}
                  className="text-blue-600 hover:underline font-medium text-left"
                >
                  {scenario.name}
                </button>
                {scenario.isLocked && (
                  <span className="ml-2 text-xs text-amber-600 font-medium">[Locked]</span>
                )}
              </td>

              <TimestampCell ts={scenario.created} />
              <TimestampCell ts={scenario.lastChanged} />
              <TimestampCell ts={scenario.implemented} />
              <TimestampCell ts={scenario.locked} />
            </tr>
          ))}

          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground text-sm">
                No scenarios. Create one above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

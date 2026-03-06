import { formatDate, formatCurrency } from '@/lib/utils';
import type { PersonDetails } from '@/types/domain';

interface Props {
  client: PersonDetails;
  partner: PersonDetails;
}

function PersonColumn({ label, person }: { label: string; person: PersonDetails }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-xs font-semibold text-teal-700 uppercase mb-2">{label}</div>
      <dl className="space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="w-36 text-muted-foreground shrink-0">Name</dt>
          <dd className="font-medium">{person.name}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-36 text-muted-foreground shrink-0">Age</dt>
          <dd>{person.age}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-36 text-muted-foreground shrink-0">Retirement Date</dt>
          <dd>{formatDate(person.retirementDate)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-36 text-muted-foreground shrink-0">Ordinary Wages</dt>
          <dd>{formatCurrency(person.ordinaryWages)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function PersonalDetailsSection({ client, partner }: Props) {
  return (
    <section className="mb-4">
      <div className="flex items-center justify-between px-4 py-2 bg-teal-700 text-white text-sm font-semibold rounded-t">
        Personal Details
      </div>
      <div className="border border-border border-t-0 rounded-b p-4 flex gap-8">
        <PersonColumn label="Client" person={client} />
        <div className="w-px bg-border" />
        <PersonColumn label="Partner" person={partner} />
      </div>
    </section>
  );
}

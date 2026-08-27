import { useEffect, useState } from 'react';

import {
  AsyncSection,
  Badge,
  Button,
  Card,
  CardHeader,
  PageHeader,
} from '../../components/ui';
import { IconCheck, IconPin, IconSparkles } from '../../components/Icons';
import { useApi } from '../../hooks/useApi';
import { api } from '../../lib/api';
import { num } from '../../lib/format';

const INTERESTS = [
  '🛕 Temples & Spirituality',
  '🏖️ Beaches',
  '🏛️ Heritage & Archaeology',
  '🌿 Nature & Wildlife',
  '🍽️ Local Cuisine',
  '🎭 Festivals & Culture',
  '🛍️ Handicrafts & Markets',
  '📷 Photography',
];

const PACE = ['Relaxed', 'Balanced', 'Packed'] as const;
const ACCOMMODATION = ['Budget', 'Mid-range', 'Premium'] as const;
const TRANSPORT = ['Private Car', 'Shuttle / Bus', 'Train', 'Self-drive'] as const;
const DIET = ['No Preference', 'Vegetarian', 'Vegan', 'Jain'] as const;

const STORAGE_KEY = 'tournexus.preferences';

interface Preferences {
  destinationIds: number[];
  interests: string[];
  budget: number;
  travellers: number;
  pace: string;
  accommodation: string;
  transport: string;
  diet: string;
  startDate: string;
  endDate: string;
  notes: string;
}

const DEFAULTS: Preferences = {
  destinationIds: [],
  interests: ['🛕 Temples & Spirituality', '🏖️ Beaches', '🍽️ Local Cuisine'],
  budget: 18000,
  travellers: 2,
  pace: 'Balanced',
  accommodation: 'Mid-range',
  transport: 'Private Car',
  diet: 'No Preference',
  startDate: '',
  endDate: '',
  notes: '',
};

export function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Preferences) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

const GRADIENTS = [
  'from-sky-500 to-indigo-500',
  'from-amber-500 to-rose-500',
  'from-violet-500 to-indigo-500',
  'from-emerald-500 to-sky-500',
];

export default function DestinationPreferences() {
  const destinations = useApi(
    () => Promise.all([api.destinations.list(), api.attractions.list()]),
    [],
  );

  const [prefs, setPrefs] = useState<Preferences>(loadPreferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 2400);
    return () => clearTimeout(timer);
  }, [saved]);

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setPrefs((current) => ({ ...current, [key]: value }));

  const toggleDestination = (id: number) =>
    setPrefs((current) => ({
      ...current,
      destinationIds: current.destinationIds.includes(id)
        ? current.destinationIds.filter((x) => x !== id)
        : [...current.destinationIds, id],
    }));

  const toggleInterest = (interest: string) =>
    setPrefs((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((x) => x !== interest)
        : [...current.interests, interest],
    }));

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      setSaved(true);
    } catch {
      /* Storage can be unavailable; the in-memory state still works. */
    }
  }

  return (
    <>
      <PageHeader
        emoji="🗺️"
        title="Destination & Preferences"
        subtitle="Pick where you are going and how you like to travel. These preferences shape the itinerary the engine generates."
        action={
          <Button onClick={save}>
            {saved ? (
              <>
                <IconCheck className="h-4 w-4" /> Saved
              </>
            ) : (
              'Save preferences'
            )}
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader
              title="Select destinations"
              subtitle="Live from /api/destinations"
              icon={<IconPin />}
            />
            <AsyncSection
              state={destinations}
              isEmpty={([rows]) => rows.length === 0}
              emptyTitle="No destinations in the database"
              emptyHint="Run `python -m app.database.seed` in the backend folder."
            >
              {([rows, attractions]) => (
                <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rows.map((destination, index) => {
                    const count = attractions.filter(
                      (a) => a.destination_id === destination.id,
                    ).length;
                    const selected = prefs.destinationIds.includes(
                      destination.id,
                    );

                    return (
                      <button
                        key={destination.id}
                        type="button"
                        onClick={() => toggleDestination(destination.id)}
                        aria-pressed={selected}
                        className={`group overflow-hidden rounded-xl border text-left transition ${
                          selected
                            ? 'border-brand-500 shadow-lg shadow-brand-600/15'
                            : 'border-line hover:border-line-strong'
                        }`}
                      >
                        <div
                          className={`relative flex h-24 items-end bg-gradient-to-br ${
                            GRADIENTS[index % GRADIENTS.length]
                          } p-3`}
                        >
                          {selected && (
                            <span className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full bg-white/95 text-brand-600">
                              <IconCheck className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <span className="text-sm font-bold text-white drop-shadow">
                            {destination.name}
                          </span>
                        </div>
                        <div className="bg-ink-850 p-3">
                          <p className="text-[11px] text-mist-400">
                            {[destination.city, destination.state]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                          <p className="mt-1.5 text-[11px] font-semibold text-brand-300">
                            {count} {count === 1 ? 'attraction' : 'attractions'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </AsyncSection>
          </Card>

          <Card delay={60}>
            <CardHeader
              title="Interests"
              subtitle="Used to weight which attractions get scheduled first"
              icon={<IconSparkles />}
            />
            <div className="flex flex-wrap gap-2 p-5">
              {INTERESTS.map((interest) => {
                const active = prefs.interests.includes(interest);
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    aria-pressed={active}
                    className={`rounded-full border px-3.5 py-2 text-xs font-medium transition ${
                      active
                        ? 'border-brand-500 bg-brand-500/12 text-brand-300'
                        : 'border-line text-mist-300 hover:border-line-strong hover:text-mist-100'
                    }`}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>
          </Card>

          <Card delay={120}>
            <CardHeader title="Trip notes" subtitle="Anything the planner should know" />
            <div className="p-5">
              <textarea
                value={prefs.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={4}
                placeholder="Travelling with elderly parents, prefer early mornings, need wheelchair access…"
                className="w-full resize-none rounded-xl border border-line bg-ink-850 px-3.5 py-3 text-sm text-mist-100 outline-none transition placeholder:text-mist-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card delay={60}>
            <CardHeader title="Trip basics" />
            <div className="space-y-5 p-5">
              <Slider
                label="Budget per person"
                value={prefs.budget}
                min={3000}
                max={80000}
                step={1000}
                display={`₹${num(prefs.budget)}`}
                onChange={(v) => update('budget', v)}
              />
              <Slider
                label="Travellers"
                value={prefs.travellers}
                min={1}
                max={12}
                step={1}
                display={String(prefs.travellers)}
                onChange={(v) => update('travellers', v)}
              />

              <div className="grid grid-cols-2 gap-3">
                <DateField
                  label="Start"
                  value={prefs.startDate}
                  onChange={(v) => update('startDate', v)}
                />
                <DateField
                  label="End"
                  value={prefs.endDate}
                  onChange={(v) => update('endDate', v)}
                />
              </div>
            </div>
          </Card>

          <Card delay={120}>
            <CardHeader title="Style" />
            <div className="space-y-4 p-5">
              <Choice
                label="Pace"
                options={PACE}
                value={prefs.pace}
                onChange={(v) => update('pace', v)}
              />
              <Choice
                label="Accommodation"
                options={ACCOMMODATION}
                value={prefs.accommodation}
                onChange={(v) => update('accommodation', v)}
              />
              <Select
                label="Transport"
                options={TRANSPORT}
                value={prefs.transport}
                onChange={(v) => update('transport', v)}
              />
              <Select
                label="Dietary preference"
                options={DIET}
                value={prefs.diet}
                onChange={(v) => update('diet', v)}
              />
            </div>
          </Card>

          <Card delay={180}>
            <CardHeader title="Summary" />
            <div className="space-y-2.5 p-5 text-xs">
              <Row
                label="Destinations"
                value={
                  prefs.destinationIds.length
                    ? `${prefs.destinationIds.length} selected`
                    : 'None yet'
                }
              />
              <Row label="Interests" value={`${prefs.interests.length} chosen`} />
              <Row
                label="Estimated budget"
                value={`₹${num(prefs.budget * prefs.travellers)}`}
              />
              <Row label="Pace" value={prefs.pace} />
              {saved && (
                <Badge tone="ok" className="mt-2">
                  <IconCheck className="h-3 w-3" /> Preferences saved locally
                </Badge>
              )}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ── Small form pieces ─────────────────────────────────────────────── */

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-mist-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs font-semibold text-mist-300">{label}</label>
        <span className="text-xs font-bold tabular-nums text-brand-300">
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-brand-500"
      />
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-mist-300">
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-ink-850 px-3 py-2.5 text-xs text-mist-100 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
      />
    </div>
  );
}

function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-mist-300">{label}</p>
      <div className="flex gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={value === option}
            className={`flex-1 rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${
              value === option
                ? 'border-brand-500 bg-brand-500/12 text-brand-300'
                : 'border-line text-mist-400 hover:border-line-strong'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-mist-300">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-ink-850 px-3.5 py-2.5 text-xs text-mist-100 outline-none transition focus:border-brand-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

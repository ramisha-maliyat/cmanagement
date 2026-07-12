import Link from "next/link";

import { SubmitButton } from "@/components/auth/submit-button";
import {
  CANTEEN_TIMEZONES,
  DEFAULT_CANTEEN_TIMEZONE,
} from "@/config/canteens";
import type { Canteen } from "@/types";

type CanteenFormProps = {
  action: (formData: FormData) => Promise<void>;
  canteen?: Canteen;
  submitLabel: string;
  pendingLabel: string;
};

function inputTime(
  value: string | null | undefined,
): string {
  return value ? value.slice(0, 5) : "";
}

export function CanteenForm({
  action,
  canteen,
  submitLabel,
  pendingLabel,
}: CanteenFormProps) {
  return (
    <form
      action={action}
      className="grid gap-5 md:grid-cols-2"
    >
      {canteen && (
        <input
          type="hidden"
          name="canteenId"
          value={canteen.id}
        />
      )}

      <div className="md:col-span-2">
        <label
          htmlFor="name"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Canteen name
        </label>

        <input
          id="name"
          name="name"
          required
          minLength={2}
          maxLength={150}
          defaultValue={canteen?.name ?? ""}
          placeholder="Campus Main Canteen"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="slug"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Canteen URL name
        </label>

        <input
          id="slug"
          name="slug"
          required
          maxLength={100}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          defaultValue={canteen?.slug ?? ""}
          placeholder="campus-main-canteen"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        <p className="mt-2 text-xs text-slate-500">
          Use lowercase letters, numbers and hyphens only.
        </p>
      </div>

      <div>
        <label
          htmlFor="timezone"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Timezone
        </label>

        <select
          id="timezone"
          name="timezone"
          required
          defaultValue={
            canteen?.timezone ??
            DEFAULT_CANTEEN_TIMEZONE
          }
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          {CANTEEN_TIMEZONES.map((timezone) => (
            <option
              key={timezone.value}
              value={timezone.value}
            >
              {timezone.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="openingTime"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Opening time
        </label>

        <input
          id="openingTime"
          name="openingTime"
          type="time"
          defaultValue={inputTime(
            canteen?.opening_time,
          )}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="closingTime"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Closing time
        </label>

        <input
          id="closingTime"
          name="closingTime"
          type="time"
          defaultValue={inputTime(
            canteen?.closing_time,
          )}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor="location"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Location
        </label>

        <textarea
          id="location"
          name="location"
          rows={3}
          maxLength={500}
          defaultValue={canteen?.location ?? ""}
          placeholder="Building A, Ground Floor, Main Campus"
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="md:col-span-2">
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Description
        </label>

        <textarea
          id="description"
          name="description"
          rows={5}
          maxLength={1000}
          defaultValue={canteen?.description ?? ""}
          placeholder="Describe this canteen and the customers it serves."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row">
        <div className="sm:w-52">
          <SubmitButton pendingText={pendingLabel}>
            {submitLabel}
          </SubmitButton>
        </div>

        <Link
          href="/vendor/canteens"
          className="rounded-lg border border-slate-300 px-5 py-3 text-center font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
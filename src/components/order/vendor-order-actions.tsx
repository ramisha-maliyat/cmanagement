import { updateVendorOrderStatusAction } from "@/app/actions/vendor-orders";
import type {
  OrderStatus,
} from "@/types";

type VendorOrderActionsProps = {
  orderId: string;
  status: OrderStatus;
};

export function VendorOrderActions({
  orderId,
  status,
}: VendorOrderActionsProps) {
  if (
    status === "completed" ||
    status === "rejected" ||
    status === "cancelled"
  ) {
    return (
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">
          Order actions
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          This order has reached a final status
          and cannot be changed.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        Order actions
      </h2>

      {status === "pending" && (
        <form
          action={
            updateVendorOrderStatusAction
          }
          className="mt-5"
        >
          <input
            type="hidden"
            name="orderId"
            value={orderId}
          />

          <input
            type="hidden"
            name="nextStatus"
            value="accepted"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Accept order
          </button>
        </form>
      )}

      {status === "accepted" && (
        <form
          action={
            updateVendorOrderStatusAction
          }
          className="mt-5"
        >
          <input
            type="hidden"
            name="orderId"
            value={orderId}
          />

          <input
            type="hidden"
            name="nextStatus"
            value="preparing"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
          >
            Start preparing
          </button>
        </form>
      )}

      {status === "preparing" && (
        <form
          action={
            updateVendorOrderStatusAction
          }
          className="mt-5"
        >
          <input
            type="hidden"
            name="orderId"
            value={orderId}
          />

          <input
            type="hidden"
            name="nextStatus"
            value="ready"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Mark ready for collection
          </button>
        </form>
      )}

      {status === "ready" && (
        <form
          action={
            updateVendorOrderStatusAction
          }
          className="mt-5"
        >
          <input
            type="hidden"
            name="orderId"
            value={orderId}
          />

          <input
            type="hidden"
            name="nextStatus"
            value="completed"
          />

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-800 px-5 py-3 font-semibold text-white hover:bg-slate-900"
          >
            Complete order
          </button>
        </form>
      )}

      {(status === "pending" ||
        status === "accepted") && (
        <form
          action={
            updateVendorOrderStatusAction
          }
          className="mt-6 border-t border-slate-200 pt-6"
        >
          <input
            type="hidden"
            name="orderId"
            value={orderId}
          />

          <input
            type="hidden"
            name="nextStatus"
            value="rejected"
          />

          <label
            htmlFor="rejectionReason"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Rejection reason
          </label>

          <textarea
            id="rejectionReason"
            name="rejectionReason"
            required
            minLength={3}
            maxLength={500}
            rows={3}
            placeholder="Example: The kitchen is closing early today."
            className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
          />

          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
          >
            Reject order
          </button>
        </form>
      )}
    </section>
  );
}
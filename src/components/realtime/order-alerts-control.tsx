"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  areOrderAlertsEnabled,
  playOrderAlert,
  setOrderAlertsEnabled,
} from "@/lib/browser/order-alerts";

type NotificationState =
  | NotificationPermission
  | "loading"
  | "unsupported";

export function OrderAlertsControl() {
  const [
    alertsEnabled,
    setAlertsEnabled,
  ] = useState(false);

  const [
    notificationState,
    setNotificationState,
  ] =
    useState<NotificationState>(
      "loading",
    );

  useEffect(() => {
    setAlertsEnabled(
      areOrderAlertsEnabled(),
    );

    if (
      !("Notification" in window)
    ) {
      setNotificationState(
        "unsupported",
      );

      return;
    }

    setNotificationState(
      Notification.permission,
    );
  }, []);

  async function enableAlerts(): Promise<void> {
    setOrderAlertsEnabled(true);
    setAlertsEnabled(true);

    /*
     * Playing a test sound during a user click
     * helps browsers permit future audio alerts.
     */
    playOrderAlert();

    if (
      !("Notification" in window)
    ) {
      setNotificationState(
        "unsupported",
      );

      return;
    }

    if (
      Notification.permission ===
      "default"
    ) {
      try {
        const permission =
          await Notification.requestPermission();

        setNotificationState(
          permission,
        );
      } catch (error) {
        console.error(
          "Notification permission error:",
          error,
        );
      }

      return;
    }

    setNotificationState(
      Notification.permission,
    );
  }

  function disableAlerts(): void {
    setOrderAlertsEnabled(false);
    setAlertsEnabled(false);
  }

  if (
    notificationState === "loading"
  ) {
    return (
      <span className="text-xs text-slate-500">
        Loading alerts...
      </span>
    );
  }

  if (alertsEnabled) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-emerald-700">
          {notificationState === "granted"
            ? "Sound and browser alerts enabled"
            : "Sound alerts enabled"}
        </span>

        <button
          type="button"
          onClick={disableAlerts}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Disable alerts
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={enableAlerts}
        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        Enable order alerts
      </button>

      {notificationState ===
        "denied" && (
        <span className="text-xs text-amber-700">
          Browser notifications are
          blocked, but sound alerts can
          still be enabled.
        </span>
      )}

      {notificationState ===
        "unsupported" && (
        <span className="text-xs text-slate-500">
          Browser notifications are not
          supported here. Sound alerts
          remain available.
        </span>
      )}
    </div>
  );
}
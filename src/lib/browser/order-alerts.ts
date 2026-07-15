const ORDER_ALERTS_KEY =
  "cmanagement-order-alerts-enabled";

type NotificationOptions = {
  title: string;
  body: string;
  href: string;
  tag: string;
};

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export function areOrderAlertsEnabled(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(
      ORDER_ALERTS_KEY,
    ) === "true"
  );
}

export function setOrderAlertsEnabled(
  enabled: boolean,
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (enabled) {
    window.localStorage.setItem(
      ORDER_ALERTS_KEY,
      "true",
    );

    return;
  }

  window.localStorage.removeItem(
    ORDER_ALERTS_KEY,
  );
}

export function playOrderAlert(): void {
  if (
    typeof window === "undefined" ||
    !areOrderAlertsEnabled()
  ) {
    return;
  }

  try {
    const audioWindow =
      window as AudioWindow;

    const AudioContextConstructor =
      window.AudioContext ??
      audioWindow.webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const audioContext =
      new AudioContextConstructor();

    const oscillator =
      audioContext.createOscillator();

    const gain =
      audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      880,
      audioContext.currentTime,
    );

    gain.gain.setValueAtTime(
      0.0001,
      audioContext.currentTime,
    );

    gain.gain.exponentialRampToValueAtTime(
      0.2,
      audioContext.currentTime + 0.03,
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.25,
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(
      audioContext.currentTime + 0.26,
    );

    oscillator.addEventListener(
      "ended",
      () => {
        void audioContext.close();
      },
    );
  } catch (error) {
    console.error(
      "Order alert sound failed:",
      error,
    );
  }
}

export function showOrderNotification({
  title,
  body,
  href,
  tag,
}: NotificationOptions): void {
  if (
    typeof window === "undefined" ||
    !areOrderAlertsEnabled() ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    const notification =
      new Notification(title, {
        body,
        tag,
        icon: "/favicon.ico",
      });

    notification.onclick = () => {
      window.focus();
      window.location.assign(href);
      notification.close();
    };
  } catch (error) {
    console.error(
      "Browser notification failed:",
      error,
    );
  }
}
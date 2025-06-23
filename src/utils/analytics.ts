// utils/analytics.ts

type AnalyticsEvent = {
  eventName: string;
  category?: string;
  label?: string;
  value?: number;
  data?: Record<string, any>;
};

const isGAAvailable = typeof window !== "undefined" && (window as any).gtag;

const getDeviceIdentifier = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const { ip } = await res.json();
    return ip || "unknown";
  } catch {
    return "unknown";
  }
};

export const trackEvent = async ({
  eventName,
  category = "User Interaction",
  label = "",
  value = 1,
  data = {},
}: AnalyticsEvent) => {
  const deviceId = await getDeviceIdentifier();

  if (isGAAvailable) {
    (window as any).gtag("event", eventName, {
      event_category: category,
      event_label: label,
      value,
      ...data,
      device_id: deviceId,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.log(`[Analytics] ${eventName}`, {
      category,
      label,
      value,
      ...data,
      device_id: deviceId,
      timestamp: new Date().toISOString(),
    });
  }
};

"use client";

import type { AnchorHTMLAttributes } from "react";
import { trackEvent, type AnalyticsEventName, type AnalyticsEventProps } from "@/lib/tracking/events";

// A plain <a> that fires a tracked event on click before letting the
// browser navigate normally (no preventDefault — never blocks the actual
// contact action). Used for the small set of raw <a> contact links
// (mailto:/wa.me) that need tracking without converting their whole parent
// (Footer, Contact page) into a Client Component.
export function TrackedLink({
  eventName,
  eventProps,
  ...anchorProps
}: AnchorHTMLAttributes<HTMLAnchorElement> & { eventName: AnalyticsEventName; eventProps?: AnalyticsEventProps }) {
  return (
    <a
      {...anchorProps}
      onClick={(e) => {
        trackEvent(eventName, eventProps);
        anchorProps.onClick?.(e);
      }}
    />
  );
}

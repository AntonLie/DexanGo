import { useEffect } from "react";
import { notifications } from "@mantine/notifications";
import { IconBellRinging } from "@tabler/icons-react";
import type { AdminNotification } from "@dexago/shared";
import { api } from "../api";

export function NotificationListener() {
  useEffect(() => {
    if (!api.getToken()) return;

    const source = new EventSource(api.notificationsUrl());

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as AdminNotification;
        notifications.show({
          title: "Profile Updated",
          message: `${data.employeeName} — ${data.message}`,
          color: "teal",
          icon: <IconBellRinging size={18} />,
          autoClose: 8000,
        });
      } catch {}
    };

    source.onerror = () => {};

    return () => source.close();
  }, []);

  return null;
}

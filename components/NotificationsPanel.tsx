'use client';

import { useState, useEffect } from "react";
import { NotificationItem } from "@/lib/types";

interface Props {
    fetchNotifications: () => Promise<NotificationItem[]>;
    intervalMs?: number;
}

export function NotificationsPanel({ fetchNotifications, intervalMs = 5000 }: Props) {
    const [items, setItems] = useState<NotificationItem[]>([]);

    useEffect(() => {
        let cancelled = false;
        const tick = async () =>  {
            try {
                const data = await fetchNotifications();
                if (!cancelled) setItems(data);
            } catch {
                // silent - a missed poll isn't worth surfacing to the user
            }
        };
        tick();

        const id = setInterval(tick, intervalMs);
        return () => {cancelled = true; clearInterval(id);};
    }, [fetchNotifications, intervalMs])

    if (items.length === 0) {
        return <p className="text-xs text-gray-400">No notifications yet — change an asset's status to trigger one.</p>;
    }

    return (
        <ul className="space-y-1">
            {items.map((n) => (
                <li key={n.SK} className="text-xs border-l-2 border-blue-400 pl-2">
                    <span className="text-gray-400">{new Date(n.createdAt).toLocaleTimeString()}</span> — {n.message}
                </li>
            ))}
        </ul>
  );
}
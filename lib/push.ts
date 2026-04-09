import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

webpush.setVapidDetails(
  "mailto:admin@tukanglapor.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: subscriptions, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("subscription")
    .eq("user_id", userId);

  if (error || !subscriptions?.length) {
    return;
  }

  const notificationPayload = JSON.stringify(payload);

  const results = await Promise.allSettled(
    subscriptions.map((row) =>
      webpush.sendNotification(row.subscription, notificationPayload)
    )
  );

  // Clean up expired/invalid subscriptions
  const failedEndpoints: string[] = [];
  results.forEach((result, i) => {
    if (result.status === "rejected" && result.reason?.statusCode === 410) {
      failedEndpoints.push(subscriptions[i].subscription.endpoint);
    }
  });

  if (failedEndpoints.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", failedEndpoints);
  }
}

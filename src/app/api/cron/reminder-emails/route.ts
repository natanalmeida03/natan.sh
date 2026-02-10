import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/utils/supabase/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: Request) {
   const authHeader = request.headers.get("authorization");
   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
   }

   const now = new Date();
   const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

   // Fetch reminders due in the next hour with email notification enabled
   const { data: reminders, error } = await supabaseAdmin
      .from("reminders")
      .select("id, user_id, title, description, due_at")
      .eq("notify_email", true)
      .eq("is_completed", false)
      .is("notified_at", null)
      .gte("due_at", now.toISOString())
      .lte("due_at", oneHourFromNow.toISOString());

   if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
   }

   if (!reminders || reminders.length === 0) {
      return NextResponse.json({ sent: 0 });
   }

   let sent = 0;
   const errors: string[] = [];

   for (const reminder of reminders) {
      // Get user email
      const { data: userData, error: userError } =
         await supabaseAdmin.auth.admin.getUserById(reminder.user_id);

      if (userError || !userData.user?.email) {
         errors.push(`No email for user ${reminder.user_id}`);
         continue;
      }

      const dueDate = new Date(reminder.due_at);
      const formattedTime = dueDate.toLocaleTimeString("en-US", {
         hour: "2-digit",
         minute: "2-digit",
      });
      const formattedDate = dueDate.toLocaleDateString("en-US", {
         weekday: "long",
         day: "2-digit",
         month: "long",
      });

      try {
         await resend.emails.send({
            from: "natan.sh <noreply@natan.sh>",
            to: userData.user.email,
            subject: `Reminder: ${reminder.title} — in 1 hour`,
            html: `
               <div style="font-family: monospace; max-width: 480px; margin: 0 auto; padding: 24px;">
                  <h2 style="margin: 0 0 8px;">${reminder.title}</h2>
                  ${reminder.description ? `<p style="color: #666; margin: 0 0 16px;">${reminder.description}</p>` : ""}
                  <p style="margin: 0 0 4px;"><strong>When:</strong> ${formattedDate} at ${formattedTime}</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                  <p style="color: #999; font-size: 12px;">natan.sh reminders</p>
               </div>
            `,
         });

         // Mark as notified
         await supabaseAdmin
            .from("reminders")
            .update({ notified_at: new Date().toISOString() })
            .eq("id", reminder.id);

         sent++;
      } catch (emailError) {
         errors.push(`Failed to send for reminder ${reminder.id}`);
      }
   }

   return NextResponse.json({ sent, total: reminders.length, errors });
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const feedbackSchema = z.object({
  subject: z
    .string()
    .trim()
    .max(120, "Subject must be 120 characters or fewer")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  message: z
    .string()
    .trim()
    .min(1, "Please write a message")
    .max(2000, "Message must be 2000 characters or fewer"),
  userAgent: z.string().trim().max(500).optional().nullable(),
});

export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => feedbackSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("feedback_messages").insert({
      account_id: userId,
      subject: data.subject,
      message: data.message,
      user_agent: data.userAgent ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

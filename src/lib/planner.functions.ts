import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const planSchema = z.object({
  planTitle: z.string().describe("A short, motivating title for the study plan."),
  totalMinutes: z.number().describe("Total planned study minutes, equal to the available time."),
  blocks: z
    .array(
      z.object({
        title: z.string().describe("Short block title, e.g. 'Review lecture 4: supply curves'."),
        topic: z.string().describe("Which requested topic this block covers."),
        minutes: z.number().describe("Minutes allocated to this block."),
        priority: z.enum(["high", "medium", "low"]).describe("Priority of this topic."),
        description: z.string().describe("One or two short, actionable sentences on what to do."),
        breakMinutes: z
          .number()
          .describe("Short break in minutes that follows this block (0 for the final block)."),
      }),
    )
    .describe("Sequential study blocks that fit exactly in the available time."),
  tips: z.array(z.string()).describe("Two or three short, practical study tips."),
});

export type StudyPlan = z.infer<typeof planSchema>;
export type StudyPlanBlock = StudyPlan["blocks"][number];

export const generateStudyPlan = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        subject: z.string().trim().min(2, "Subject is required.").max(60),
        topics: z
          .string()
          .trim()
          .min(3, "Please list the topics you need to study.")
          .max(500, "Keep topics under 500 characters."),
        minutes: z.coerce
          .number({ message: "Available time must be a number of minutes." })
          .int("Use whole minutes.")
          .min(15, "You need at least 15 minutes for a plan.")
          .max(600, "Plans are limited to 10 hours (600 minutes)."),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const apiKey = process.env["LOVABLE_API_KEY"];
      if (!apiKey) {
        return { error: "The AI planner is not configured yet. Please try again later." };
      }

      const [{ createLovableAiGatewayProvider }, { streamText, Output }] = await Promise.all([
        import("./ai/gateway.server"),
        import("ai"),
      ]);

      const provider = createLovableAiGatewayProvider(apiKey, undefined, {
        baseURL: "https://ai.gateway.lovable.dev/v1",
        structuredOutputs: true,
      });

      const result = streamText({
        model: provider("google/gemini-3.8-flash"),
        output: Output.object({ schema: planSchema }),
        system:
          "You are a friendly study coach for college students. Create realistic, focused study plans. " +
          "Spread the available minutes across the requested topics: give more time to harder or exam-critical material " +
          "(mark those blocks high priority), less to revision or lighter topics. Insert short 5-10 minute breaks between " +
          "blocks, never exceed the total available minutes, make the block minutes sum to at most the available time, " +
          "and keep every description short, concrete and actionable.",
        prompt:
          `Subject: ${data.subject}\n` +
          `Topics to study: ${data.topics}\n` +
          `Available time: ${data.minutes} minutes\n\n` +
          "Create a structured study plan for this session.",
      });

      const plan = (await result.output) as StudyPlan;
      return { plan, error: null as string | null };
    } catch (error) {
      console.error("generateStudyPlan failed:", error);
      return {
        plan: null as StudyPlan | null,
        error: "The planner could not create a plan just now. Please try again in a moment.",
      };
    }
  });

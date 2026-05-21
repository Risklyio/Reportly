"use server";

import { createAssessment } from "@/lib/services/assessments";
import { redirect } from "next/navigation";

export type StartAssessmentState = {
  error?: string;
};

export async function startAssessmentAction(
  _prev: StartAssessmentState,
  formData: FormData
): Promise<StartAssessmentState> {
  const clientName = String(formData.get("clientName") ?? "").trim();
  const appName = String(formData.get("appName") ?? "").trim();
  const assessmentDate = String(formData.get("assessmentDate") ?? "").trim();
  const assessorName = String(formData.get("assessorName") ?? "").trim();
  const scopeNotes = String(formData.get("scopeNotes") ?? "").trim();

  if (!clientName || !appName || !assessmentDate) {
    return { error: "Client name, application name, and date are required." };
  }

  try {
    const assessment = await createAssessment({
      clientName,
      appName,
      assessmentDate,
      assessorName,
      scopeNotes,
    });
    redirect(
      `/assessments/${assessment.id}?domain=application_security&filter=all`
    );
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Could not start assessment. Check Supabase setup and try again.",
    };
  }
}

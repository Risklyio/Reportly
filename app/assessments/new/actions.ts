"use server";

import { createAssessment } from "@/lib/services/assessments";
import { getDomainsForFramework, M365_FRAMEWORK_ID } from "@/lib/controls/catalog";

export type StartAssessmentState = {
  error?: string;
  redirectTo?: string;
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
  const frameworkId = String(formData.get("frameworkId") ?? "").trim();

  if (!clientName || !appName || !assessmentDate) {
    return { error: "Client name, application name, and date are required." };
  }

  const selectedFramework = frameworkId || M365_FRAMEWORK_ID;

  try {
    const assessment = await createAssessment({
      clientName,
      appName,
      assessmentDate,
      assessorName,
      scopeNotes,
      frameworkId: selectedFramework,
    });
    const firstDomain =
      getDomainsForFramework(selectedFramework)[0]?.id ?? "application_security";
    return {
      redirectTo: `/assessments/${assessment.id}?domain=${encodeURIComponent(firstDomain)}&filter=all`,
    };
  } catch (e) {
    return {
      error:
        e instanceof Error
          ? e.message
          : "Could not start assessment. Check Supabase setup and try again.",
    };
  }
}

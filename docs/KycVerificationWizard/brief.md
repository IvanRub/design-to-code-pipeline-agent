# Component Brief: KYC Verification Wizard

## Source (raw brief)
> 3 steps: personal info, document upload, selfie. Step indicator at the top. Back/Next
> navigation. Document upload supports drag-and-drop and file picker (PDF, JPG, PNG, max
> 10MB). Final step shows verification status: pending review, approved, rejected.

## Summary
A multi-step form ("wizard") used to collect Know-Your-Customer (KYC) identity verification
data from a user, split across three sequential steps: personal information, document
upload, and a selfie capture/upload. A step indicator communicates progress at the top of
the component. The user moves between steps with Back / Next navigation. The document
upload step must support both drag-and-drop and a native file picker, restricted to PDF,
JPG, and PNG files up to 10MB. The final (selfie) step also displays a verification status
of pending review, approved, or rejected.

## Steps (as stated)
1. **Personal info** — no fields are specified in the brief (no names of inputs given).
2. **Document upload** — drag-and-drop area + file picker; accepted types PDF, JPG, PNG;
   max file size 10MB.
3. **Selfie** — capture/upload of a selfie; this step also displays the verification status.

## Navigation (as stated)
- A step indicator is shown at the top of the component.
- Back and Next buttons allow moving between steps.
- No explicit rule is given for whether Back is disabled on step 1, or whether Next is
  gated by validation — not specified in the brief.

## Document upload constraints (as stated)
- Supports drag-and-drop.
- Supports a file picker (click to browse).
- Accepted file types: PDF, JPG, PNG.
- Max file size: 10MB.
- No explicit multi-file vs single-file rule stated (assume single document upload per
  step, since the brief refers to "document upload" in the singular — flagged as an
  assumption, not a fact).

## Verification status (final/selfie step, as stated)
Three explicit status values:
- Pending review
- Approved
- Rejected

No additional detail is given on what triggers each status, or on copy/messaging for each.

## Explicit constraints extracted
- Exactly 3 steps, in this order: personal info → document upload → selfie.
- Step indicator must be positioned at the top.
- Back/Next navigation must be present.
- Document upload accepts only PDF, JPG, PNG.
- Document upload max size: 10MB.
- Final verification status must support 3 discrete values: pending review, approved, rejected.

## Open questions (for the gap-analysis / spec stage — not answered here)
1. What fields make up "personal info" (name, DOB, address, national ID, etc.)?
2. Is the selfie captured via device camera, uploaded as a file, or both?
3. Is Back disabled on step 1 and Next disabled/blocked by validation on incomplete steps?
4. Can a user upload more than one document, or exactly one?
5. What happens on upload error (wrong file type, oversized file, upload failure)?
6. What triggers transition from "pending review" to "approved"/"rejected" — is this
   synchronous after selfie submission, or async/polled?
7. Is there a submit/finish action distinct from "Next" on the final step?

## Design system alignment
No explicit colors, spacing, typography, or component names were referenced in the brief,
so no tokens could be mapped and none are recorded as unmapped raw values.

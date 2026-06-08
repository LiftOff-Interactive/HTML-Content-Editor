# Feature — Knowledge Check Widget

## What It Is
A simple, ungraded self-assessment question. The learner selects an answer and gets immediate feedback (correct/incorrect + explanation). No score tracking. No LMS communication. Just a lightweight comprehension check embedded in the content.

## Widget Data Schema
```json
{
  "_v": 1,
  "questionType": "multiple-choice",
  "question": "Which of the following best describes active listening?",
  "options": [
    { "id": "opt-1", "text": "Waiting for your turn to speak", "correct": false, "feedback": "This is passive listening." },
    { "id": "opt-2", "text": "Fully concentrating on the speaker", "correct": true, "feedback": "Correct! Active listening means giving your full attention." },
    { "id": "opt-3", "text": "Taking notes during a meeting", "correct": false, "feedback": "Note-taking can help, but it's not the core of active listening." }
  ],
  "hint": "",
  "allowRetry": true
}
```

**Question types for v1**: `multiple-choice` (pick one), `true-false` (two options: True/False)

## Visual Design
- Question text (larger font, clear heading style)
- Options: radio buttons (multiple choice) or two large buttons (true/false)
- On submission: correct option highlighted in green, incorrect in red, per-option feedback text shown
- "Try Again" button if `allowRetry: true`
- No progress bar, no score, no next button

## Acceptance Criteria
- [x] Widget inserts via slash command (`/quiz` or `/knowledgecheck`) and toolbar dropdown
- [x] Edit modal: question type selector, question text, add/edit/delete options, mark correct answer, add per-option feedback, hint text, allow retry toggle
- [x] True/false variant auto-creates two options (True, False) with the correct one selectable
- [x] "Submit" button reveals feedback in both editor preview and exported HTML
- [x] "Try Again" button resets the question state
- [x] Correct answer is NOT visually revealed before submission (options look identical before the learner submits)
- [x] Correct answer is not trivially discoverable in the exported HTML source — correct indices are base64-encoded as `atob(...)` in the inline script
- [x] Accessible: form uses proper `<fieldset>`/`<legend>` structure, radio inputs are labeled

## Open Questions
- [x] **Answer obfuscation**: base64 encoding used — stops casual inspection, appropriate for self-assessment.
- [x] **Multiple correct answers**: Out of scope for v1 — single correct answer only.
- [x] **Feedback display**: Inline below each option (confirmed).
- [x] **Hint**: "Show Hint" toggle button pre-submission (confirmed).

## Bug Fixed
- **Export: Try Again visible on load** — hardcoded `"Segoe UI"` (double quotes) in the `ui` font-family string broke the `style="..."` HTML attribute, silently dropping `display:none` from the retry button. Fixed by reading `--font-family-ui` from `getComputedStyle` instead, which returns the single-quoted form (`'Segoe UI'`) safe for HTML attribute values.

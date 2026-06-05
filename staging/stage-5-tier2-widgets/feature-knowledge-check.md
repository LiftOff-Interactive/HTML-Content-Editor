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
- [ ] Widget inserts via slash command (`/quiz` or `/knowledgecheck`) and toolbar dropdown
- [ ] Edit modal: question type selector, question text, add/edit/delete options, mark correct answer, add per-option feedback, hint text, allow retry toggle
- [ ] True/false variant auto-creates two options (True, False) with the correct one selectable
- [ ] "Submit" button reveals feedback in both editor preview and exported HTML
- [ ] "Try Again" button resets the question state
- [ ] Correct answer is NOT visually revealed before submission (options look identical before the learner submits)
- [ ] Correct answer is not trivially discoverable in the exported HTML source (no `data-correct="true"` attribute in plaintext — store answers obfuscated or just accept that a determined learner can inspect source; this is self-assessment, not a test)
- [ ] Accessible: form uses proper `<fieldset>`/`<legend>` structure, radio inputs are labeled

## Open Questions
- [ ] **Answer obfuscation**: Since this is self-assessment (not graded), is it worth obfuscating the correct answer in the HTML source? Simple base64 encoding of the answer key is enough to stop casual inspection without adding real security. Decide before implementation.
- [ ] **Multiple correct answers**: "Select all that apply" is a common variant. Out of scope for v1 — single correct answer only.
- [ ] **Feedback display**: Should feedback appear inline below each option or in a summary block at the bottom? Inline (per option) is more instructive and common in eLearning tools.
- [ ] **Hint**: If a hint is set, should it appear as a "Show Hint" button before submission? Yes — same pattern as click-reveal.

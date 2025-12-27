# Jadarat Assess - Project Requirements Document

## TL;DR

Jadarat Assess is a multi-tenant, bilingual (English/Arabic) SaaS platform for enterprises to design, launch, and analyze internal employee assessments focused on skills, performance, potential, and development. It offers an AI-powered builder for graded quizzes and professional assessments (e.g., cognitive, personality, behavioral, SJT, language, and profiles like DESC), orchestrated via reusable Assessments and time-bound Assessment Groups. HR gains unified employee profiles aggregating all assessment history and reports, enabling better promotion, selection, and development decisions at scale.

---

## Goals

### Business Goals

- Launch Jadarat's proprietary assessment platform to reduce dependency on external tools and create a defensible B2B product line.
- Increase enterprise ACV and retention by bundling Jadarat Assess into talent, assessment, and development offerings.
- Become the reference bilingual (EN/AR) assessment solution in the region, differentiating on localization and scientific robustness.
- Support at least dozens of tenant organizations with clean separation of data, billing, and branding managed by Jadarat Super Admin.
- Generate actionable talent insights (for promotion, selection, and development) that can later be integrated into broader Jadarat products.

### User Goals

- HR Admins can create valid, job-relevant assessments in minutes using AI, with type-specific guidance (cognitive, personality, behavioral, SJT, language, profiles).
- HR Admins can run Assessment Groups (cycles) for different cohorts, easily invite employees, and track completion and results.
- Organization Admins can manage organization branding, user access, and subscription usage without needing Jadarat involvement for daily operations.
- HR can view a unified Employee Profile per person, aggregating all historical assessment results, and drill down into detailed reports.
- Employees receive a frictionless, trustworthy, bilingual assessment experience from any device, with clear feedback when allowed.

### Non-Goals

- No dedicated Manager/Assessor portal in v1; managers receive insights via exports or offline sharing by HR.
- No deep real-time integrations with HRIS/ATS/LMS systems in v1 (imports/exports limited to CSV/manual processes).
- No external market benchmarking or advanced norming in v1 (only simple internal comparisons if needed).
- No complex role-based access beyond Super Admin, Organization Admin, and HR Admin in v1.
- No mobile apps in v1; responsive web only.

---

## User Stories

**Personas:** Super Admin (Jadarat), Organization Admin, HR Admin, Employee (participant, link-only).

### Super Admin

- As a Super Admin, I want to create and manage multiple client organizations, so that each enterprise has an isolated and secure workspace.
- As a Super Admin, I want to configure subscriptions, usage limits, and manual billing cycles per organization, so that we can manage commercial terms and invoicing.
- As a Super Admin, I want to define global product settings (available assessment types, language defaults, feature flags), so that all organizations operate within controlled boundaries.

### Organization Admin

- As an Organization Admin, I want to configure my organization profile and branding (name, logo, primary color, primary language), so that employees see a consistent branded experience.
- As an Organization Admin, I want to invite and manage users (HR Admins) and assign roles, so that only authorized staff can design and run assessments.
- As an Organization Admin, I want to monitor subscription usage (assessments created, Assessment Groups, participant volume), so that I can manage capacity and coordinate with Jadarat on renewals/upgrades.

### HR Admin – Assessment Builder

- As an HR Admin, I want to choose between creating a Graded Quiz or an Assessment/Profile, so that I can support both test-style and profile-style use cases.
- As an HR Admin, I want to select Quick setup (generic) or Advanced setup (type-specific), so that I can either move fast or fine-tune psychometric parameters.
- As an HR Admin, I want to specify the assessment language (EN or AR) and have AI generate questions and reports accordingly, so that content is fully localized.
- As an HR Admin, I want AI to generate questions, answer keys, scoring logic, and result schemas from my description and selected type, so that I don't need deep psychometrics expertise.
- As an HR Admin, I want to manually add, edit, reorder, and delete questions, and store them in a reusable question bank, so that I can refine and reuse content.

### HR Admin – Assessment Types

- As an HR Admin, I want specific configuration fields for Cognitive assessments (subdomains, difficulty, question count), so that I can target relevant cognitive abilities.
- As an HR Admin, I want specific fields for Personality assessments (model, traits, question count), so that I can create scientifically grounded personality profiles.
- As an HR Admin, I want specific fields for Behavioral (FBA-style) assessments (domains, behavior dimensions) and SJT (competencies, number of scenarios), so that I can reflect workplace behavior and scenarios accurately.
- As an HR Admin, I want specialized options for language assessments (skills: grammar, vocabulary, reading; question distribution; CEFR-like level), so that I can align with language requirements.
- As an HR Admin, I want to configure for each assessment whether it is graded, whether to show results to employees, and whether to allow PDF downloads, so that I align with internal HR policy.

### HR Admin – Assessment Groups & Invitations

- As an HR Admin, I want to create Assessment Groups that reference a base Assessment and define a title and description (e.g., "DESC – Q1 – IT Team"), so that I can run assessment campaigns per cohort.
- As an HR Admin, I want to set start and end dates for an Assessment Group, so that employee links are valid only within that window.
- As an HR Admin, I want to add participants to an Assessment Group with name, department, job title, employee code, and email, so that I can track identified participation.
- As an HR Admin, I want the system to generate unique UUID-based links per participant, so that each link is secure, traceable, and bound to a single person and group.
- As an HR Admin, I want to enable a group link for an Assessment Group that allows any employee to self-identify and complete the assessment, so that I can support open or very large cohorts.

### HR Admin – Results & Reporting

- As an HR Admin, I want to view overall statistics per Assessment Group (invited, started, completed, average score, distribution), so that I can measure engagement and performance.
- As an HR Admin, I want to open an individual participant's detailed report, including raw scores, subscale scores, and AI-generated narrative interpretation, so that I can make informed talent decisions.
- As an HR Admin, I want to control whether employees see their results for each Assessment, so that I can hide sensitive outcomes where needed.
- As an HR Admin, I want to export PDF reports and tabular data (CSV) per group, so that I can share with stakeholders and use in HR processes.

### HR Admin – Employees

- As an HR Admin, I want an Employees tab listing all participants with their key data, so that I can easily find individuals.
- As an HR Admin, I want to open an employee profile to see chronological history of all assessments they completed, with date, type, and status/score, so that I can understand their trajectory.
- As an HR Admin, I want to open any historic report from an employee profile, so that I can review context without navigating through older Assessment Groups.

### Employee (Participant)

- As an Employee, I want to open my unique assessment link (or group link) and see a clean, branded, bilingual interface, so that I trust and understand the process.
- As an Employee, I want to see clear instructions, time limits (if any), and progress indicators, so that I can manage my time and complete the assessment successfully.
- As an Employee, I want to see my results and download a PDF report when allowed, so that I know my strengths and areas for development.
- As an Employee, when results are not shared, I want a clear thank-you screen confirming submission, so that I know my responses are recorded.

---

## Functional Requirements

Feature groups are grouped by area and indicated with a rough priority (P0 = must for v1; P1 = nice-to-have in v1 if feasible).

### 1. Multi-Tenant & Roles

#### Tenant & Super Admin (P0)

- Create, view, edit, and deactivate Organizations (tenants).
- Configure subscription parameters per Organization: max HR Admins, assessment volume limits, billing cycle metadata (for manual billing).
- View high-level usage metrics per Organization (assessments created, Assessment Groups, participants).

#### Organization & Roles (P0)

- **Organization Admin:**
  - Configure organization profile (name, logo, primary color, default language EN/AR).
  - Manage users and roles: invite HR Admins via email, assign/remove HR Admin roles.
  - View subscription usage and limits, with simple indicators (e.g., remaining assessment quota).
- **HR Admin:** full operational access within their Organization for assessments, groups, employees, and reports.
- No manager role in v1.

### 2. Assessment Model

#### Core Entities

##### Assessment (P0)

- **Fields:** id, organizationId, name, description, type (e.g., Cognitive, Personality, Behavioral, SJT, English, Generic Quiz, Generic Profile), graded (boolean), language (EN/AR), default question count, showResultsToEmployee (boolean), allowEmployeePdfDownload (boolean), allowPreview (boolean), AIFeedbackEnabled (boolean), createdBy, createdAt, updatedAt.
- **Relationship:** one Assessment can be referenced by many Assessment Groups.

##### Assessment Group (P0)

- **Fields:** id, organizationId, assessmentId, name, description, startDate, endDate, status (draft, active, closed), groupLinkEnabled (boolean), groupLinkUrl, createdBy, createdAt, updatedAt.
- **Relationship:** one Assessment Group references one Assessment and has many Participants.

##### Participant (within Assessment Group) (P0)

- **Fields:** id, assessmentGroupId, employeeId (nullable for group link first-time), name, department, jobTitle, employeeCode, email, participantUuid (unique, used in invite link), status (invited, started, completed, expired), languageResolved (EN/AR based on Assessment and possibly user choice).

##### Employee (Organization-level) (P0)

- **Fields:** id, organizationId, name, department, jobTitle, employeeCode, email, createdAt, updatedAt.
- **Relationship:** one Employee can have many Participant records across Assessment Groups.

##### Question & Question Bank (P0)

- **Question:** id, assessmentId or bankId, type (MCQ single, MCQ multi, Likert, open text, SJT-matrix, etc.), text, options, correctAnswer (if graded), scoring logic, metadata (tags, difficulty, subdomain).
- **Question Bank:** ability to mark questions as reusable and browse/filter them when building new Assessments.

### 3. AI Assessment Builder

#### Builder Modes (P0)

**Step 1: Choose Assessment Category:**
- Graded Quiz
- Assessment/Profile

**Step 2: Choose Assessment Type (for Advanced setup):**
- Cognitive
- Personality/Psychometric
- Behavioral (FBA-style)
- Situational Judgment Test (SJT)
- English / Language
- Generic Graded Quiz
- Generic Profile (e.g., DESC, custom profiles)

**Step 3: Choose Setup Mode:**
- Advanced setup (Type-specific) – default.
- Quick setup (Generic).

#### Quick Setup – Generic Fields (P0)

Common fields across all types:
- Assessment name, description (what to test, target role/level).
- Language (EN or AR).
- Number of questions (exact or range).
- Overall difficulty (easy, medium, hard, mixed).
- Graded or non-graded.
- Show results to employee (On/Off).
- Allow employee PDF download (On/Off).
- AI feedback (On/Off, who sees it: HR only vs HR + employee).

**AI behavior:**
- Generate question set according to type + description + question count + difficulty.
- For graded types, generate correct answers and scoring schema.
- For profiles, generate scales/traits and scoring rules.

#### Advanced Setup – Type-Specific (P0)

##### Cognitive Assessment
- Configurable subdomains (e.g., numerical, verbal, logical, spatial, memory).
- Difficulty distribution (e.g., % easy/medium/hard or "mixed" default).
- Total question count and per-subdomain distribution.
- Duration: auto-calculated from question count with override option.

##### Personality/Psychometric
- Model selection (e.g., Big Five-like, DISC-like) for internal logic; we do not name specific trademarks in UI if necessary.
- Number of traits/factors to display.
- Questions per trait.
- Response scale (Likert 1–5, 1–7).

##### Behavioral (FBA-style)
- Behavior domains (antecedents, behaviors, consequences, frequency).
- Number of questions per domain.

##### SJT
- Job role/level description.
- Competencies to measure (e.g., decision-making, teamwork, leadership).
- Number of scenarios.
- Response style (pick best option, rank options).

##### English / Language
- Skills to include (grammar, vocabulary, reading comprehension; optional writing).
- Question distribution per skill and total questions.
- Target proficiency band (e.g., basic, intermediate, advanced).

##### Generic Quiz/Profile
- Same as Quick setup, but with optional extra metadata tags and traits to define custom scales.

#### Question Management (P0)

After AI generation, HR Admin can:
- View list of questions, grouped by section/subdomain.
- Edit text, options, correct answers, scoring weights.
- Reorder questions via drag-and-drop.
- Delete or add manual questions.
- Save questions to question bank with tags (type, domain, difficulty, language).
- Preview Assessment: simulate the participant experience before publishing.

### 4. Assessment Groups & Invitations

#### Assessment Group Creation (P0)

- From an Assessment, HR Admin creates a new Assessment Group.
- Set name, description, startDate, endDate, and language (if Assessment supports multiple – in v1, single language).
- Toggle group link (On/Off). If On, the system generates a single group URL.

#### Participants Management (P0)

- Add participants individually via form fields (Name, Department, Job Title, Employee Code, Email).
- Optional: bulk import via CSV template (P1 if time allows).
- For each participant, generate a unique participantUuid and invitation URL.
- Participant status auto-updates: invited (created), started (opened link and answered at least one question), completed (submitted), expired (after endDate without completion).

**Link expiry logic:**
- Before startDate: link shows "Not yet open" message.
- After endDate: link shows "Assessment closed" message and does not allow response.

#### Group Link Flow (P0)

When group link is enabled, any visitor sees:
- Language-specific welcome screen.
- Form to capture Name, Department, Job Title, Employee Code, Email before starting.

On submission, system:
- Attempts to match an existing Employee by email or employee code; if found, link new Participant to existing Employee.
- Else, creates a new Employee record.
- Creates a Participant record and starts the assessment.

**Basic duplicate prevention rules (P1):** optional enforcement of one submission per email/employeeCode per Assessment Group.

### 5. Assessment-Taking Experience

#### Participant UI (P0)

- Bilingual UI: all static text, buttons, error messages available in EN and AR with RTL support for AR.
- Organization branding applied (logo, primary color).

**Steps:**

1. **Landing:** intro text, instructions, time estimate, start button.
2. **Question pages:**
   - Questions shown one by one or in blocks (configurable or default per type).
   - Progress indicator (e.g., "Question 5 of 30").
   - For timed assessments, countdown timer with clear warnings.
   - Validation: required questions must be answered; show simple error messages.
3. **Submission confirmation:**
   - If showResultsToEmployee = false: show "Thank you / submission received" screen.
   - If true: show results page (see below).

#### Results to Employee (P0)

- If showResultsToEmployee = true:
  - Employees see the same core report view as HR: summary, scores, scales, AI narrative (if enabled), but only for their own data.
  - If allowEmployeePdfDownload = true: "Download PDF" button present.
- If showResultsToEmployee = false: no scores, no narrative, only confirmation.

### 6. Results, Reporting & Employee Profiles

#### Group-Level Reporting (P0)

For each Assessment Group, HR Admin can view:
- High-level stats: number invited, started, completed, not started, expired.
- Summary metrics: average score (for graded), basic distribution (e.g., histogram buckets) and possibly simple percentiles (internal only).
- Table of participants with key fields (name, department, job title, employee code, email, status, overall score/label).
- Filters/search: by department, status, score range, etc. (P1 for advanced filtering).

#### Individual Reports (P0)

Per-Participant detailed report based on Assessment type:
- **Header:** organization, Assessment, Assessment Group, date/time, participant details.
- **Scores:** overall score and relevant subscales (e.g., cognitive subdomains, personality traits).
- **AI-generated narrative feedback** based on results (when AIFeedbackEnabled = true), tailored to target role and reason if provided (promotion, selection, development).
- Option to download as PDF (HR always; employees if allowed).

#### Employee Profiles (P0)

- Employees tab listing all Employees with search and filters (by department, job title, name, code).
- Employee detail page showing:
  - Core data: name, department, job title, employee code, email.
  - Timeline/list of completed assessments: date, Assessment name, Assessment Group, type, score/label, link to report.
  - From any row, HR can open the detailed report.
- **Future extension (P1):** AI "Talent Snapshot" summarizing all assessments into strengths, risks, and development recommendations.

### 7. Localization & Bilingual Support

#### System Localization (P0)

- All system UI (Super Admin, Org Admin, HR Admin, participant) supports EN and AR.
- Per-user language preference for Admins; participant UI language driven by Assessment language.
- Proper RTL support for AR: layout mirroring, text alignment, pagination, charts where relevant.

#### Content Localization (P0)

- AI Builder must generate questions, options, instructions, and reports in the selected language (EN or AR).
- For Arabic assessments, ensure language quality is acceptable and supports diacritics where needed (design note for AI prompts).
- All static templates for emails, screens, and PDFs have EN and AR variants.

### 8. Security, Access & Compliance

#### Authentication & Authorization (P0)

- Admins (Super, Organization, HR) use authenticated logins with role-based access control.
- Employees access via signed UUID links; no login required.
- Links are scoped to a specific Assessment Group and Participant or to the group link context.

#### Data Isolation (P0)

- Strong tenant isolation at database or logical layer: an Organization cannot access any other organization's data.
- Super Admin access is restricted to operational/admin views; no cross-tenant leakage in UI.

#### Privacy & Data Handling (P0)

- Store participant responses, scores, and reports under Organization's tenant.
- Provide ability to deactivate an Assessment Group; historical data remains read-only.
- For deletions (P1), define whether physical or logical delete; for v1 at least support employee anonymization upon Org request.

---

## User Experience

Below is a high-level UX journey focusing on HR Admin and Employee.

### Entry Point & First-Time User Experience

1. Super Admin logs into a dedicated console to create Organizations and configure subscriptions.
2. Organization Admin receives invite email, sets password, and logs into the Org workspace. They configure branding, default language, and invite HR Admins.
3. HR Admin logs in and lands on a dashboard showing Assessments, Assessment Groups, and key metrics.

### Core Experience – HR Admin

#### Step 1: Create Assessment

- HR Admin clicks "Create Assessment".
- Chooses category: Graded Quiz or Assessment/Profile.
- Chooses type: Cognitive, Personality, Behavioral, SJT, English, Generic Quiz, Generic Profile.
- Default mode: Advanced setup (Type-specific). Option to switch to Quick setup.
- Fills in necessary fields (description, language, question count, subdomains/traits/etc., showResultsToEmployee, allowEmployeePdfDownload, AIFeedbackEnabled).
- Triggers AI generation; system displays a questions list grouped by sections.
- HR Admin edits, reorders, and saves. Assessment status becomes "Ready".

#### Step 2: Create Assessment Group

- From an Assessment, HR Admin clicks "Create Group".
- Sets name (e.g., "DESC – Q1 – IT Team"), description, startDate, endDate, groupLinkEnabled.
- Adds participants via form and optionally CSV import.
- System generates UUID links for each participant and (if enabled) a group link.
- Group status becomes "Active" at startDate.

#### Step 3: Monitor & Manage

- HR Admin monitors live stats on Group detail view: invitations, starts, completions.
- HR Admin can resend links or export a list with URLs if sending via external channels.

#### Step 4: Review Results

- HR Admin opens the Group results dashboard to see completion and performance summary.
- Clicks on any participant to open a detailed report, including AI interpretation.
- If relevant, export PDFs or CSV for further analysis.

#### Step 5: Employee Profiles

- HR Admin navigates to the Employees tab.
- Searches for an employee and opens their profile.
- Views list of all assessments and can open any historic report from there.

### Core Experience – Employee

#### Step 1: Access Link

- Employees receive either a unique link (e.g., via email) or a group link shared by HR.
- If group link: they first fill their name, department, job title, employee code, email before starting.

#### Step 2: Take Assessment

- See intro page in correct language with instructions and time estimate.
- Progress indicator shows completion status; for timed tests, a visible timer.
- Validations ensure mandatory items are answered before moving forward or submitting.

#### Step 3: Completion & Feedback

On submission:
- If showResultsToEmployee = false: sees a thank-you / confirmation screen only.
- If true: sees results page with their scores, simple visualizations, and AI-generated narrative (if enabled), plus optional PDF download.

### Advanced Features & Edge Cases

- **Link Expiry:** Links must handle pre-start and post-end gracefully with clear messages; no ability to answer outside the window.
- **Duplicate Submissions:** Participant unique links allow a single completed response; re-opened links show either the thank-you or view-only results (configurable later).
- **Draft vs Published Assessments:** Only Assessments marked as "Ready/Published" can be used to create Assessment Groups.

### UI/UX Highlights

- Consistent, minimal UI with clear typography and accessible color contrast for both EN and AR.
- Responsive design for desktop, tablet, and mobile.
- RTL layout for Arabic: navigation, text alignment, and icons mirrored appropriately.
- Clear error states and validation messages for all forms and questionnaire items.

---

## Narrative

An HR Director at a large regional bank needs to run a Q2 internal assessment cycle to inform promotions and development plans for mid-level managers. Historically, this process has involved scattered tools: Excel lists of employees, PDF tests shared over email, and manual scoring by consultants. Results arrive late and are difficult to compare across functions and cycles.

With Jadarat Assess, the HR Director's team logs into a branded, bilingual platform and quickly creates several Assessments using the AI Builder: a Cognitive test, a Personality profile, a Situational Judgment Test, and an English proficiency quiz. For each type, the AI suggests relevant subdomains, question counts, and scoring structures, all in Arabic for this cycle. HR refines a few questions, saves them into the question bank, and marks each Assessment as ready.

They then create Assessment Groups such as "Cognitive – Q2 – IT Managers" and "Personality – Q2 – All Mid-Level Leaders", assign start and end dates, and upload participant data. Unique secure links are generated automatically. For a development program, they also enable an open group link so employees can self-enroll in a non-graded DESC-style profile.

As the cycle runs, HR monitors completion and performance in real time. When it ends, they open each Group's analytics and drill into individual reports, which include AI-generated narratives describing strengths, risks, and suggested development focus areas. In the Employees tab, they can open any manager's profile to see the full history of assessments across quarters. For some assessments, employees see their own results and PDF reports; for promotion-critical ones, they only see a confirmation while HR keeps results internal. The bank now has a structured, repeatable, and localized assessment process powered by Jadarat Assess.

---

## Success Metrics

### User-Centric Metrics

- Number of active Organizations and HR Admins using Jadarat Assess within 6–12 months.
- Average time to create and launch a new Assessment Group (from idea to active links).
- Completion rate of assessments per Group and overall.
- HR Admin satisfaction (internal NPS or simple satisfaction scores) with assessment creation and reporting.

### Business Metrics

- Number and value of enterprise contracts including Jadarat Assess within the first year.
- Reduction in third-party assessment tool spend as Jadarat's own tool replaces them.
- Renewal and expansion rate of organizations using Jadarat Assess (upsell to higher volume tiers).

### Technical Metrics

- Platform uptime and availability (e.g., ≥ 99.5% for admin and participant flows).
- Average response time for key APIs and assessment pages.
- Error rate on assessment submissions (target near 0%; robust retry for transient failures).

### Tracking Plan

**Key events to track (per Organization and globally):**

**Admin events:**
- assessment_created, assessment_published, assessment_deleted.
- assessment_group_created, assessment_group_activated, assessment_group_closed.
- participant_added, participant_imported_bulk.
- report_viewed (HR), employee_profile_viewed.

**Participant events:**
- assessment_link_opened, assessment_started, assessment_question_answered, assessment_submitted.
- assessment_results_viewed (employee), pdf_report_downloaded (HR/employee).

---

## Technical Considerations

### Technical Needs

**Major components:**

#### Frontend
- Multi-role web app (Super Admin, Organization Admin, HR Admin), responsive, bilingual with RTL support.
- Participant assessment UI optimized for simplicity and speed.

#### Backend
- Multi-tenant API with role-based authorization and strict tenant isolation.
- Core services for Assessments, Assessment Groups, Questions, Participants, Employees, Reporting.
- AI orchestration service to call LLMs for question generation and report generation, with prompt templates and safety checks.

#### Data Layer
- Relational database (or equivalent) for structured entities (Organizations, Users, Assessments, Groups, Participants, Employees, Questions).
- Storage for responses and reports (e.g., responses table + generated PDF storage).

### Integration Points

- Email delivery for Admin invites and (optionally) participant link notifications (if v1 includes integrated emailing; if not, links are exported).
- Optional CSV import/export for participants and results.
- No deep integrations (HRIS/ATS/LMS) in v1; design should anticipate future connectors.

### Data Storage & Privacy

- Store all data per Organization with clear ownership; tenantId on all relevant tables.
- Assessment responses and scores must be treated as sensitive data; access limited to HR Admins of that Organization and Jadarat Super Admin where strictly necessary.
- Consider future support for data deletion/anonymization requests per Employee or per Assessment Group.

### Scalability & Performance

- Initial target: support tens of active Organizations, each with multiple concurrent Assessment Groups and up to thousands of participants per Group.
- The system should handle peaks where many employees access assessments simultaneously within a narrow window (e.g., campaign deadline).
- AI generation requests should be queued and observable, with reasonable timeouts and retries.

### Potential Challenges

- Ensuring high-quality, scientifically coherent AI-generated content in both English and Arabic; may require curated prompts and templates per type.
- Designing flexible yet simple type-specific configuration UIs that don't overwhelm HR Admins.
- Managing assessment timing and link validity robustly across time zones (choose one canonical time zone per Organization).
- Building PDF reports with good bilingual and RTL rendering.
- Maintaining strict tenant isolation while enabling Super Admin operational views.

---

## Milestones & Sequencing

### Project Estimate

Overall scope: Medium to Large (approx. 4–8 weeks of focused work with a lean team, assuming modern tooling and access to LLM APIs).

### Team Size & Composition

Aim for a small, fast team:
- Product/BA (part-time; you).
- 1–2 Full-stack engineers (frontend + backend).
- 1 UX/UI designer (part-time).
- 1 AI/Prompt engineer role (can be combined with full-stack if skilled).

**Total:** 2–4 people actively building.

### Suggested Phases

#### Phase 1 – Core Platform & Roles (1–2 weeks)

**Key Deliverables:**
- Multi-tenant structure with Super Admin and Organization creation.
- Roles and auth for Super Admin, Organization Admin, HR Admin.
- Organization branding and basic usage dashboard.

**Dependencies:** authentication system, base database schema.

#### Phase 2 – Assessments & AI Builder v1 (1–2 weeks)

**Key Deliverables:**
- Assessment entity + CRUD, type system (Cognitive, Personality, Behavioral, SJT, English, Generic).
- AI Builder with Quick setup and Advanced setup UIs; question generation integrated.
- Question bank with basic management.

**Dependencies:** LLM integration and prompt design.

#### Phase 3 – Assessment Groups, Invitations & Participant UI (1–2 weeks)

**Key Deliverables:**
- Assessment Groups with date windows, participant management, unique UUID links and group links.
- Participant assessment-taking UI (EN/AR, responsive, link expiry logic).

**Dependencies:** Assessment completion flow, response storage.

#### Phase 4 – Results, Reporting & Employee Profiles (1–2 weeks)

**Key Deliverables:**
- Group-level reporting views.
- Individual reports with AI-generated narrative.
- Employees tab with unified profiles and report access.
- PDF report generation (EN/AR).

**Dependencies:** scoring engine, AI report generation, PDF service.

#### Phase 5 – Localization, Hardening & Launch (1–2 weeks, overlapped where possible)

**Key Deliverables:**
- Full bilingual UI (EN/AR), RTL support, content validation.
- Performance and security pass, basic logging and monitoring.
- Documentation of APIs and admin flows for internal and AI agent use.

**Dependencies:** all core features implemented.

---

## Assessment Type Details

### 1. Cognitive Assessment (IQ)

#### Detailed Description

A cognitive assessment measures an individual's reasoning ability, problem-solving skills, working memory, numerical aptitude, logical thinking, and information-processing speed. IQ-style tests help predict learning ability, job performance in analytical roles, and decision quality under pressure.

#### Scientific Reference

Yes.

**Scientific Foundations / References:**
- Wechsler Adult Intelligence Scale (WAIS) – David Wechsler
- Raven's Progressive Matrices – J. C. Raven
- Stanford–Binet Intelligence Scales – Lewis Terman
- Cattell–Horn–Carroll (CHC) Theory of Cognitive Abilities

#### How Many Questions?

- 20–40 items for micro-level workplace IQ screening
- 60–80 items for a more robust assessment
- Test duration typically 15–35 minutes.

---

### 2. Psychometric Assessment (Personality)

#### Detailed Description

Personality assessments measure an individual's behavioral tendencies, preferences, emotional stability, and motivational drivers. These tests help predict cultural fit, job behavior, and how a person interacts with teams or handles stress, change, and ambiguity.

#### Scientific Reference

Yes.

**Scientific Foundations / References:**
- Big Five Personality Model (OCEAN) – Costa & McCrae
- MBTI theory (Jungian Psychological Types) – Carl Jung (note: MBTI has lower reliability but widely used)
- Hogan Personality Inventory (HPI) – Robert Hogan
- DISC Model – William Marston

#### How Many Questions?

- 20–30 items for short-form workplace personality profiling
- 50–80 items for a more predictive and reliable assessment
- Usually includes Likert-scale responses (1–5 or 1–7).

---

### 3. Behavioral Assessment (Functional Behavioral Assessment – FBA)

#### Detailed Description

A Functional Behavioral Assessment identifies why a behavior occurs, focusing on triggers (antecedents), the behavior itself, and consequences. In organizations, it is used to analyze productivity issues, conduct concerns, repeated performance problems, or patterns of workplace behavior.

Typically includes qualitative and quantitative elements:
- Observations
- Behavior logs
- Pattern analysis
- Self-report behavioral scales

#### Scientific Reference

Yes.

**Scientific Foundations / References:**
- Applied Behavior Analysis (ABA) – B.F. Skinner
- Functional Behavior Assessment Framework – Iwata et al.
- Behavioral Functional Analysis – Hanley et al.

#### How Many Questions?

FBA is usually mixed-method but for questionnaire-based FBA:
- 15–30 questions covering antecedents, behavior patterns, triggers, consequences, and frequency.

---

### 4. Situational Judgment Test (SJT – Competency-Based)

#### Detailed Description

SJTs present realistic workplace scenarios and ask the employee to choose or rank the best response. They measure job-relevant competencies such as decision-making, teamwork, communication, customer service, leadership, and integrity.

#### Scientific Reference

Yes.

**Scientific Foundations / References:**
- Motowidlo, Dunnette & Carter (1990) – foundational SJT research
- Christian, Edwards & Bradley (2010) – meta-analysis of SJTs
- Lievens & Sackett (2012) – cross-cultural and job-specific SJTs

#### How Many Questions?

- 8–15 scenarios
- Each scenario has 3–5 response options
- Total items: 25–40 options
- Typical duration: 10–20 minutes.

---

### 5. English Language Assessment

#### Detailed Description

English proficiency tests measure vocabulary, grammar, reading comprehension, writing ability, and sometimes listening. Used to ensure an employee can perform job duties requiring communication in English—emails, reports, presentations, technical communication.

#### Scientific Reference

Yes.

**Scientific Foundations / References:**
(Not a single theory, but established frameworks)
- CEFR Framework (A1–C2) – Council of Europe
- TOEIC / TOEFL research standards – ETS
- Cambridge English Assessment Model

#### How Many Questions?

Depending on skills measured:
- Grammar & Vocabulary: 20–30 questions
- Reading Comprehension: 3–5 passages with ~10 questions each
- Writing (optional): 1 short prompt
- Micro-assessment total: 30–40 questions for a standard workplace screening.

---

## Technical Specifications for AI Agents

### 1. Core Domain Model (Entities & Relationships)

AI agents should treat these as primary objects:

#### Organization

- **Fields:** id, name, logoUrl, primaryColor, defaultLanguage (EN/AR), status, subscriptionPlan, usageCounters.
- **Relationships:** has many User, Assessment, AssessmentGroup, Employee.

#### User

- **Fields:** id, organizationId, role (SUPER_ADMIN, ORG_ADMIN, HR_ADMIN), name, email, languagePreference, status.

#### Assessment

- **Fields:**
  - id, organizationId, name, description,
  - category (GRADED_QUIZ, PROFILE),
  - type (COGNITIVE, PERSONALITY, BEHAVIORAL, SJT, ENGLISH, GENERIC_QUIZ, GENERIC_PROFILE),
  - language (EN, AR),
  - graded (bool),
  - showResultsToEmployee (bool),
  - allowEmployeePdfDownload (bool),
  - allowPreview (bool),
  - aiFeedbackEnabled (bool),
  - status (DRAFT, READY, ARCHIVED),
  - config (JSON: type-specific settings),
  - createdBy, createdAt, updatedAt.
- **Relationships:** has many Question, many AssessmentGroup.

#### Question

- **Fields:**
  - id, assessmentId or bankId,
  - language (EN/AR),
  - itemType (MCQ_SINGLE, MCQ_MULTI, LIKERT, OPEN_TEXT, SJT_CHOICE, SJT_RANKING, etc.),
  - text, options[],
  - correctAnswer / correctAnswers (if graded),
  - scoringLogic (JSON; e.g., option → score, trait weighting),
  - metadata (difficulty, subdomain/trait, tags).

#### QuestionBankEntry

- **Fields:** id, organizationId, questionId, tags, sourceAssessmentId.

#### AssessmentGroup

- **Fields:**
  - id, organizationId, assessmentId,
  - name, description,
  - startDateTime, endDateTime,
  - status (DRAFT, ACTIVE, CLOSED),
  - groupLinkEnabled (bool), groupLinkUuid,
  - createdBy, createdAt, updatedAt.
- **Relationships:** has many Participant.

#### Employee

- **Fields:** id, organizationId, name, department, jobTitle, employeeCode, email, createdAt, updatedAt.

#### Participant

- **Fields:**
  - id, assessmentGroupId, employeeId (nullable until matched),
  - name, department, jobTitle, employeeCode, email,
  - participantUuid, status (INVITED, STARTED, COMPLETED, EXPIRED),
  - createdAt, updatedAt.

#### Response / Attempt

- **Fields:**
  - id, participantId, assessmentId, languageResolved,
  - startedAt, submittedAt,
  - answers (array of {questionId, value}),
  - scores (overall + subscales as JSON),
  - aiReport (JSON: narrative sections),
  - resultVisibleToEmployee (bool snapshot).

---

### 2. High-Level API Surface (for AI Agents)

#### 2.1 Tenant & User Management

```
POST /organizations
```
- Input: org profile + subscription meta.
- Output: organizationId.

```
POST /organizations/{orgId}/users
```
- Create Organization Admin or HR Admin.
- Input: email, name, role.

```
GET /organizations/{orgId}/usage
```
- Returns usage counters for dashboards and guardrails.

#### 2.2 Assessment Management

```
POST /organizations/{orgId}/assessments
```
- Create a new Assessment in DRAFT.
- Input: base fields + category, type, language, graded, toggles, config.

```
GET /organizations/{orgId}/assessments/{assessmentId}
```
- Retrieve Assessment definition and questions.

```
PATCH /organizations/{orgId}/assessments/{assessmentId}
```
- Update metadata, config, toggles.

```
POST /organizations/{orgId}/assessments/{assessmentId}/publish
```
- Set status to READY (validation: has questions, config valid).

#### 2.3 AI Builder Endpoints

These are orchestrating LLM calls; AI agents must:
- Build prompts from assessment.type, assessment.language, and assessment.config.
- Respect psychometric guidance per type.

```
POST /ai/builder/generate-questions
```
- **Input:**
  - assessmentType, category, language,
  - description, questionCount,
  - config (type-specific: subdomains, traits, skills, difficulty, etc.).
- **Output:** list of Question-like JSON objects, including scoring metadata.

```
POST /ai/reports/generate
```
- **Input:**
  - assessmentType, language,
  - scores (overall and subscales),
  - optional context: targetRole, reason (promotion, development, selection).
- **Output:** structured narrative JSON, e.g.: summary, strengths[], risks[], developmentRecommendations[].

Agents must be able to:
- Re-generate questions for a section if HR requests it.
- Generate Arabic and English variants based on language.

#### 2.4 Question Bank

```
POST /organizations/{orgId}/questions/bank
```
- Save an existing Question into the bank with tags.

```
GET /organizations/{orgId}/questions/bank
```
- Query bank by tags (type, domain, difficulty, language).

---

### 3. Assessment Group & Participant Flows

#### 3.1 Create Assessment Group

```
POST /organizations/{orgId}/assessments/{assessmentId}/groups
```
- Input: name, description, startDateTime, endDateTime, groupLinkEnabled.
- Output: assessmentGroupId, groupLinkUrl (if enabled).

#### 3.2 Add Participants

```
POST /organizations/{orgId}/groups/{groupId}/participants
```
- Single add. Input: name, department, jobTitle, employeeCode, email.
- **Logic:**
  - Look up existing Employee by employeeCode or email.
  - If exists, reuse employeeId; else, create Employee.
  - Create Participant with generated participantUuid, status = INVITED.
- Output: participantId, invitationUrl.

```
POST /organizations/{orgId}/groups/{groupId}/participants/bulk-upload (optional P1)
```
- CSV input, same logic per row; returns summary + generated links.

#### 3.3 Group Link Flow

```
GET /groups/{groupLinkUuid}
```
- Returns landing page config; if now outside [startDateTime, endDateTime], return "not open/closed" state.

```
POST /groups/{groupLinkUuid}/start
```
- Input: employee info fields.
- Logic: same matching/creation as above, Participant created with status STARTED.
- Output: session token or redirect URL to assessment runner.

---

### 4. Assessment Runner (Participant UX Engine)

AI agents responsible for frontend can think in terms of a simple state machine:

**States:** NOT_OPEN, READY, IN_PROGRESS, REVIEW, COMPLETED, CLOSED.

#### 4.1 Start Attempt

```
GET /run/{participantUuid} or GET /run/group/{sessionToken}
```
- Validate time window, status, and map to Assessment & Group.
- Resolve languageResolved from Assessment.
- If allowed, return Assessment structure (questions + UI config) and move Participant status to STARTED.

#### 4.2 Submit Answers

```
POST /run/{participantUuid}/submit
```
- Input: answers[].
- **Logic:**
  - Validate required questions.
  - Score using Question.scoringLogic and Assessment config.
  - Persist Attempt with scores and answers.
  - If assessment.aiFeedbackEnabled, call /ai/reports/generate, persist aiReport.
  - Update Participant.status = COMPLETED (if within window) else EXPIRED logic if out of time.
- **Output:**
  - If showResultsToEmployee = false: flag resultHidden, return {"view":"THANK_YOU"}.
  - If true: return full scores, aiReport, and canDownloadPdf flag.

---

### 5. Reporting & Employee Profiles

#### 5.1 Group Reporting

```
GET /organizations/{orgId}/groups/{groupId}/summary
```
- Returns: counts (invited/started/completed/expired), average scores, distribution.

```
GET /organizations/{orgId}/groups/{groupId}/participants
```
- Returns: tabular view of participants with status and key metrics.

#### 5.2 Individual Report

```
GET /organizations/{orgId}/participants/{participantId}/report
```
- Returns:
  - Participant details, Assessment/Group metadata.
  - scores and aiReport.

```
GET /organizations/{orgId}/participants/{participantId}/report.pdf
```
- Generates or serves cached bilingual PDF based on the JSON report.

#### 5.3 Employee Profile

```
GET /organizations/{orgId}/employees
```
- List/search employees.

```
GET /organizations/{orgId}/employees/{employeeId}
```
- Core profile + list of all attempts: each with assessment name, group, date, overall score.

```
GET /organizations/{orgId}/employees/{employeeId}/attempts
```
- For deeper programmatic access to all their assessment data.

---

### 6. Guardrails & Business Rules for Agents

AI/LLM agents that generate questions and reports must respect:

- **Language:** use assessment.language exclusively (no mixing EN/AR in same question unless explicitly requested).
- **Type constraints:**
  - **Cognitive:** question formats must be objective and scorable; ensure correct answers and consistent difficulty.
  - **Personality/Behavioral:** no "right" answers; use Likert scales and map items to traits.
  - **SJT:** each scenario has multiple options; scoring must mark best (and optionally worst) options per competency.
  - **English:** questions must target the requested skills and difficulty band.
- **Question count & structure:** stay within questionCount and per-domain allocations from config.
- **Safety & Bias:** avoid discriminatory or culturally inappropriate content; keep scenarios generic or role-relevant and neutral.

---

### 7. Localization Requirements for Agents

- All generated EN text must be natural business English; AR must be professional Modern Standard Arabic with correct RTL punctuation.
- PDF/report layouts must support EN LTR and AR RTL text blocks.
- Static labels and prompts must be retrieved from localization resources, not hardcoded in generated text.

---

### 8. Execution Order for an AI "Builder Agent"

Recommended behavior for an autonomous agent that receives an instruction like "Create a Cognitive Assessment for mid-level IT managers":

1. Call `POST /assessments` with base metadata and type = COGNITIVE.
2. Based on user input, fill config with subdomains, questionCount, difficulty, etc.
3. Call `POST /ai/builder/generate-questions` to get question set.
4. Persist questions via `POST /assessments/{assessmentId}/questions` (or bulk endpoint).
5. Optionally save selected questions to bank.
6. Mark Assessment as READY via `/publish`.
7. Optionally create an Assessment Group and invitations.

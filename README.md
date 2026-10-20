
# CS Repo — PFCCL Subsidiaries Repository

## 📌 Introduction

CS Repo is a company-secretarial repository and management application designed to organize, maintain, and access information related to PFCCL and its subsidiaries. It provides a centralized interface for managing company master data, board meetings, statutory filings, share transfers, certificates, corporate records, and supporting documents.

The application combines a hierarchical company tree, a dynamic details workspace, meeting compliance tracking, document management, and an AI-powered assistant to make corporate information easier to navigate and maintain.

The objective is to evolve CS Repo into a reliable, collaborative workspace where authorized users can manage records, track compliance activities, retrieve documents, and maintain a clear history of changes.

## 🌟 Objectives

- **Centralized Repository:** Maintain company information, corporate records, and documents in one place.
- **Hierarchical Navigation:** Organize PFCCL, divisions, subsidiaries, and company-specific sections in a structured tree.
- **Compliance Tracking:** Manage board meetings, meeting records, important dates, and compliance-related information.
- **Document Management:** Upload, view, download, and delete supporting files associated with company records.
- **AI-Assisted Information Retrieval:** Use an integrated AI assistant to help users work with selected company information.
- **Data Integrity:** Support reliable saving, future undo and recovery capabilities, and controlled access to sensitive corporate records.
- **Future Collaboration:** Enable multiple authorized users to work with the same repository while maintaining consistency and accountability.

## ✨ Existing Features

### 1. Hierarchical Company Tree

The application presents the organization through a structured hierarchy.

- PFCCL as the root organization.
- Divisions, including UMPP and ITP.
- Companies belonging to the respective divisions.
- Company-specific detail sections, such as Master Data, Meetings, Filings, Transfer, Certificates, and Miscellaneous.
- Expandable and collapsible tree sections for easier navigation.
- Company selection to load the corresponding details in the workspace.
- Filtering companies by incorporation year and company status.
- Adding and deleting company records through the interface.

### 2. Dynamic Details Workspace

The details workspace displays information according to the currently selected organization, division, company, or company subsection.

It includes dedicated views for:

- **PFCCL Details:** Organization-level information and board meeting overview.
- **Division Details:** Division-level information and company listings.
- **Company Details:** Company profile and general corporate information.
- **Master Data:** Company master records, directors, shareholders, and related information.
- **Meetings:** Meeting records, dates, compliance information, and supporting documents.
- **Filings:** Filing records and their associated information.
- **Transfer:** Share or other transfer-related records maintained by the application.
- **Certificates:** Certificate records and associated documents.
- **Miscellaneous:** Additional company information that does not fit into the other predefined sections.
- **Board Meeting Overview:** A consolidated view of relevant board meeting information and compliance activities.

The workspace is designed to keep related information organized while allowing users to navigate between records without leaving the main application.

### 3. Board Meeting Events and Compliance Tracking

CS Repo includes a dedicated board-events sidebar and meeting-related views.

Current capabilities include:

- Displaying board meeting events and reminders.
- Opening the relevant company and meeting context directly from an event.
- Viewing company-specific meeting records.
- Creating, updating, and deleting meeting records.
- Recording early board meetings.
- Displaying meeting compliance summaries.
- Tracking meeting-related dates and information used by the reminder system.

The application refreshes its meeting overview periodically while open to reduce the risk of displaying stale reminder information.

### 4. Document Management

Documents can be associated with relevant company records and detail sections.

Existing capabilities include:

- Uploading files to supported record fields.
- Deleting uploaded files.
- Opening associated documents.
- Downloading files where supported.
- Viewing PDF documents through an integrated PDF pane.
- Displaying document-related errors when an operation fails.
- Opening PDFs alongside the main details workspace.

The document layer uses shared file utilities to resolve file information, identify PDF documents, and prepare file downloads.

### 5. People and Corporate Records

The application contains reusable components for maintaining structured corporate information, including people-related records.

Examples include:

- Directors and shareholders.
- Designations and other person-specific fields.
- Date, text, number, and selection fields.
- Structured record tables.
- Status indicators and formatted dates.

These components provide common form and display behavior across the relevant company sections.

### 6. AI Assistant

CS Repo includes an integrated AI assistant intended to help users work with repository information.

The frontend supports:

- Opening and closing the AI assistant.
- Sending prompts through the configured AI API.
- Displaying conversational messages.
- Selecting relevant information from the details workspace as AI context.
- Managing selected context items before using them.
- Removing individual selections.
- Handling AI API errors and unsuccessful requests.

The assistant communicates through the application's API layer rather than calling an AI provider directly from individual UI components.

The actual AI capabilities and available providers depend on the server-side implementation.

### 7. API-Driven Data Management

The application uses a centralized API client to communicate with the backend.

Existing operations cover:

- Retrieving repository metadata.
- Loading divisions and company records.
- Retrieving individual companies and their detailed sections.
- Creating, updating, and deleting companies.
- Uploading and deleting files.
- Retrieving meeting dashboards and event reminders.
- Creating, updating, and deleting meetings.
- Recording early board meetings.
- Communicating with the AI assistant.

A custom React hook coordinates data retrieval, local application state, persistence, and refresh operations.

### 8. Data Loading and Save Coordination

The current frontend includes several mechanisms to make repository interactions more efficient and consistent:

- Lazy loading of company and detail data when required.
- Request caching to avoid unnecessary repeated fetches.
- Deduplication of equivalent in-flight requests.
- Local state updates when users edit company information.
- Debounced company saves to group rapid consecutive edits.
- Per-company save queues to serialize pending save operations within the same client.
- Refreshing repository and meeting summaries after successful updates.

These mechanisms improve responsiveness and coordinate editing activity within a running application instance. They do not, by themselves, guarantee conflict-free simultaneous editing across multiple users or browser sessions.

## 🧱 Existing Architecture

CS Repo follows a component-based React architecture with a centralized application shell, a hierarchical details workspace, reusable UI components, a custom data-management hook, and a shared API service.

The codebase is organized around the main areas of the user interface so that related components, styles, and functionality can be maintained together.

### High-Level Architecture

```text
User Interface
      |
      v
React Application Shell
      |
      +--------------------+
      |                    |
      v                    v
Company Tree         Board Events Sidebar
      |
      v
Details Workspace
      |
      +-------------------------------+
      |               |               |
      v               v               v
General Details   Navigation       PDF Pane
      |
      +------------------------------------+
      |          |          |              |
      v          v          v              v
  Master Data  Meetings   Filings   Other Sections
      |
      v
Data Management Hook
      |
      v
Central API Service
      |
      v
Backend REST API
      |
      +--------------------+
      |          |         |
      v          v         v
 Repository   Meetings    AI Services
```

The backend and its internal implementation are separate from the frontend source described here.

### Existing Source Structure

The project follows a UI-oriented structure in which folder names and numerical prefixes reflect the intended sequence of interface sections.

```text
src/
│
├── App.jsx
├── App.css
├── main.jsx
│
├── 01-app-shell/
│   │
│   ├── 00-header/
│   │   └── header.jsx
│   │
│   ├── 01-board-events/
│   │   ├── BoardEventsSidebar.jsx
│   │   └── boardEventsSidebar.css
│   │
│   ├── 02-company-tree/
│   │   ├── CompanyTree.jsx
│   │   ├── companyTree.css
│   │   ├── TreeNode.jsx
│   │   └── treeNode.css
│   │
│   ├── 03-details-workspace/
│   │   ├── DetailsWorkspace.jsx
│   │   ├── detailsWorkspace.css
│   │   │
│   │   ├── 01-navigation/
│   │   │   ├── DetailsNavigation.jsx
│   │   │   └── detailsNavigation.css
│   │   │
│   │   ├── 02-general-details/
│   │   │   ├── GeneralDetails.jsx
│   │   │   ├── generalDetails.css
│   │   │   │
│   │   │   ├── 01-root/
│   │   │   │   ├── PfcclDetails.jsx
│   │   │   │   └── pfcclDetails.css
│   │   │   │
│   │   │   ├── 02-division/
│   │   │   │   ├── DivisionDetails.jsx
│   │   │   │   └── divisionDetails.css
│   │   │   │
│   │   │   ├── 03-company/
│   │   │   │   ├── CompanyDetails.jsx
│   │   │   │   └── companyDetails.css
│   │   │   │
│   │   │   └── 04-company-sections/
│   │   │       ├── 01-master-data/
│   │   │       ├── 02-meetings/
│   │   │       ├── 03-filings/
│   │   │       ├── 04-transfer/
│   │   │       ├── 05-certificates/
│   │   │       ├── 06-miscellaneous/
│   │   │       └── 07-board-meeting-overview/
│   │   │
│   │   └── 03-pdf-pane/
│   │       ├── PDFPane.jsx
│   │       └── pdfPane.css
│   │
│   └── 04-ai-assistant/
│       ├── AIAssistant.jsx
│       └── aiAssistant.css
│
├── 02-features/
│   │
│   ├── documents/
│   │   ├── FileField.jsx
│   │   ├── fileField.css
│   │   └── PDFViewer.jsx
│   │
│   ├── meetings/
│   │   ├── MeetingRow.jsx
│   │   ├── MeetingComplianceSummary.jsx
│   │   └── meetingComplianceSummary.css
│   │
│   └── people/
│       ├── PeopleRegister.jsx
│       └── peopleRegister.css
│
├── 03-shared/
│   │
│   ├── helpers/
│   │   └── dataHelpers.js
│   │
│   └── ui/
│       ├── CompactTable.jsx
│       ├── compactTable.css
│       ├── FormField.jsx
│       ├── formField.css
│       ├── StatusPill.jsx
│       ├── statusPill.css
│       └── dataHelpers.js
│
├── 04-hooks/
│   └── hooks.js
│
├── 05-services/
│   └── api.js
│
├── 06-config/
│   └── treeConfig.js
│
└── 07-utils/
    ├── aiSelection.js
    ├── dataMerge.js
    ├── detailNavigation.js
    ├── fileUtils.js
    └── selection.js
```

*The tree above represents the intended UI-oriented organization. Individual file names may vary slightly between working copies.*

### Architectural Responsibilities

| Layer | Responsibility |
|---|---|
| Application shell | Coordinates the top-level layout and major interface sections. |
| Company tree | Displays the organization hierarchy and handles company selection, filtering, and tree interactions. |
| Details workspace | Coordinates the main details panel, detail navigation, document pane, and related workspace interactions. |
| General details | Selects and renders the appropriate details view for the current hierarchy level. |
| Feature components | Provide focused functionality for documents, meetings, and people-related records. |
| Shared UI | Provides reusable form fields, tables, status indicators, and display helpers. |
| Data hook | Loads and caches data, coordinates local updates, persists changes, and refreshes relevant information. |
| API service | Centralizes HTTP requests and backend endpoint definitions. |
| Configuration | Stores organization-tree and related application definitions. |
| Utilities | Provides data merging, selection handling, file operations, AI-context selection, and navigation helpers. |

## 🔄 Data Flow

The application's main data flow is request-driven.

1. The React application initializes and requests repository metadata and division information.
2. The data-management hook loads the selected company and relevant details when needed.
3. The company tree updates its selected state according to user interactions.
4. The details workspace renders the selected root, division, company, or company subsection.
5. User edits update the local application state and are persisted through the API service.
6. Successful company and meeting operations refresh relevant repository or meeting summaries.
7. File operations use dedicated API endpoints and update the associated company details.
8. AI interactions pass prompts and selected context through the AI API.

The application uses cached data and deferred saves to reduce repeated requests during normal interaction.

## 🔌 API Integration

The frontend centralizes HTTP communication in `api.js`.

The API base URL is configured through the `VITE_API_BASE_URL` environment variable. If this variable is not provided, the frontend defaults to `/api`.

### Repository Endpoints

The current API client supports operations equivalent to:

| Operation | Endpoint |
|---|---|
| Retrieve PFCCL root information | `GET /pfccl` |
| Retrieve divisions | `GET /divisions` |
| Retrieve companies for a division, year, and optional status | `GET /divisions/:division/years/:year/companies` |
| Retrieve a company | `GET /companies/:companyId` |
| Retrieve a company's detail section | `GET /companies/:companyId/details/:detailKey` |
| Create a company | `POST /companies` |
| Update a company | `PATCH /companies/:companyId` |
| Delete a company | `DELETE /companies/:companyId` |
| Upload files | `POST /companies/:companyId/details/:detailKey/files` |
| Delete a file | `DELETE /companies/:companyId/details/:detailKey/files/:fileId` |

### Meeting Endpoints

| Operation | Endpoint |
|---|---|
| Retrieve meeting dashboard | `GET /meetings/dashboard` |
| Retrieve meeting events | `GET /meetings/events` |
| Retrieve company meetings | `GET /companies/:companyId/meetings` |
| Create a meeting | `POST /companies/:companyId/meetings` |
| Update a meeting | `PATCH /companies/:companyId/meetings/:meetingId` |
| Delete a meeting | `DELETE /companies/:companyId/meetings/:meetingId` |
| Record an early board meeting | `POST /companies/:companyId/meetings/board/early` |

### AI Endpoints

| Operation | Endpoint |
|---|---|
| Retrieve available AI providers | `GET /ai/providers` |
| Send a chat request | `POST /ai/chat` |

These routes describe the endpoints used by the frontend API client. They do not specify the backend's internal database structure, authorization rules, or hosting architecture.

## 🛠️ Technology Stack

| Component | Technology | Role |
|---|---|---|
| Frontend | React | Component-based user interface and state-driven rendering |
| Language | JavaScript / JSX | Application logic and UI components |
| Styling | CSS | Component-specific and application-wide styling |
| Development environment | Vite-based frontend configuration | Development server and environment-variable handling |
| API communication | Fetch API | Communication with backend endpoints |
| Data coordination | Custom React hook | Loading, caching, saving, and refreshing repository data |
| Document support | Browser file APIs and PDF rendering components | File upload, download, and PDF viewing |
| AI integration | Gemini and Groq API | Prompt submission and contextual AI assistance |
| Backend | Node.js, Express | Persistent repository, meeting, document, and AI operations |

The exact backend framework, database, file-storage mechanism, and AI provider configuration depend on the backend deployment.

## 🚀 Getting Started

### Prerequisites

- Node.js and npm.
- The project dependencies installed from the repository's `package.json`.
- Access to a compatible backend API.
- Appropriate backend configuration for repository data, meetings, document storage, and any enabled AI services.

### Installation

1. Clone the repository:

   ```bash
   git clone <your-repository-url>
   cd <repository-directory>
   ```

2. Install the frontend dependencies:

   ```bash
   npm install
   ```

3. Configure the API base URL if the backend is not available under the frontend's default `/api` path.

   Create or update the frontend `.env` file:

   ```env
   VITE_API_BASE_URL=http://localhost:<backend-port>/api
   ```

   Replace `<backend-port>` with the actual port used by the backend. Alternatively, configure the development server to proxy `/api` to the backend.

4. Start the frontend using the development script defined in `package.json`:

   ```bash
   npm run dev
   ```

5. Open the local address printed by the development server.

6. Ensure that the backend is running and that the configured API routes are accessible.

> **Note:** The frontend source alone is not a complete deployment. Repository persistence, meeting operations, file storage, and AI execution depend on the corresponding backend services.

## 🔐 Security and Data Integrity

CS Repo handles corporate records and documents, so access control and reliable change management are important areas for future development.

The frontend API client currently includes credentials in its HTTP requests. This provides a mechanism for working with cookie-based authentication when supported by the backend, but it does not itself implement user login or authorization.

Future production deployments should enforce access permissions on the server, validate all changes, protect file operations, and keep sensitive credentials out of frontend code.

## 🔮 Planned Features and Future Improvements

The following capabilities are planned enhancements and should be implemented together with the necessary backend support.

### 1. Undo Changes and Version History

Introduce the ability to undo accidental or unwanted changes to company records.

Potential capabilities include:

- Undoing recent edits.
- Restoring earlier versions of a record.
- Maintaining a change history for important data.
- Showing what changed, when it changed, and which user made the change.
- Confirming or reviewing changes before restoring an older version.
- Supporting recovery after accidental edits or deletions where sufficient history has been retained.

For reliable recovery across sessions and users, change snapshots or equivalent revision history should be persisted on the server rather than relying only on browser memory.

### 2. Login and Role-Based Permissions

Introduce a secure login system and permission levels appropriate for different responsibilities.

Potential roles could include:

- **Administrator:** Manage users, permissions, and repository-wide settings.
- **Editor:** Create and modify authorized records, meetings, and supporting documents.
- **Viewer:** View permitted company information and documents without modifying them.
- **Approver:** Review and approve designated changes where an approval workflow is required.

The final roles and permissions should be defined according to actual organizational requirements.

Planned capabilities include:

- Login and logout.
- Session management.
- Role-based access control.
- Permission checks for viewing, creating, editing, deleting, uploading, and approving records.
- Restricted access to sensitive company information.
- User identity attached to audit history and changes.

Permissions must be enforced by the backend as well as reflected in the frontend interface.

### 3. Concurrent Editing and Multi-User Collaboration

Enable multiple authorized users to work on the repository without silently overwriting each other's changes.

Potential improvements include:

- Detecting when a record has changed since a user loaded it.
- Comparing local edits with the latest saved version.
- Warning users when conflicting changes are detected.
- Providing options to reload, compare, or selectively reconcile conflicting changes.
- Using record revisions or optimistic concurrency checks.
- Refreshing relevant views when other users change shared records.
- Providing real-time updates where appropriate through technologies such as WebSockets or server-sent events.

The existing client-side save queue coordinates saves within one application instance. A separate server-side concurrency mechanism will be required to reliably coordinate writes from different users and sessions.

### 4. Audit Logs and Change Accountability

Introduce a durable audit log for important operations.

Potential entries include:

- Record creation and modification.
- Deletion and restoration.
- Document uploads and deletions.
- Meeting creation and changes.
- Changes to access permissions.
- Approval and rejection actions.

Audit records should capture the user, timestamp, operation, affected record, and relevant before-and-after information where appropriate.

Audit history should be protected from unauthorized modification.

### 5. Improved Collaboration and Notifications

Potential additions include:

- Notifications when assigned or relevant records change.
- Reminders for upcoming compliance deadlines.
- Alerts for overdue meeting-related activities.
- Notifications when changes require approval.
- Indicators showing when a shared record may have been modified by another user.
- Optional presence indicators showing when another user is working on a record.

### 6. Stronger Data Validation and Recovery

Potential improvements include:

- More comprehensive server-side validation.
- Consistent error reporting.
- Safer deletion and restoration workflows.
- Confirmation for destructive operations.
- Database backup and recovery procedures.
- More robust handling of failed saves and retryable requests.
- Automated tests for repository and meeting operations.

### 7. Performance and Scalability

Potential improvements include:

- More selective data fetching for large repositories.
- Pagination or virtualization for large company and meeting lists.
- More deliberate cache invalidation after updates.
- Reduced unnecessary API requests.
- Optimized document handling for large files.
- Better management of long-running AI requests.
- Monitoring and logging for failed API operations and slow responses.

## 📊 Engineering Considerations

The main engineering challenges in CS Repo are related to data integrity, state coordination, document management, and reliable collaboration rather than computationally intensive algorithms.

| Area | Existing Approach | Future Direction |
|---|---|---|
| Data loading | Cached requests and lazy loading | Better cache invalidation and scalable list loading |
| Persistence | Debounced updates and per-company save queues within the client | Server-side revision checks and cross-session conflict protection |
| Undo and recovery | No explicit undo mechanism is exposed in the supplied frontend source | Persistent version history and record restoration |
| Authentication | API requests are configured to include credentials | Secure login, session management, and server-enforced permissions |
| Concurrent editing | Local save coordination and periodic meeting refresh | Cross-user conflict detection, reconciliation, and live updates |
| Auditability | Repository operations are exposed through the API layer | Durable audit records tied to authenticated users |
| Documents | Dedicated upload, deletion, and PDF viewing components | Stronger access checks, retention policies, and recovery |
| AI assistance | Frontend integration through AI API endpoints | Controlled access to context, reliable server-side validation, and improved observability |

## ⚖️ Architectural Trade-offs

| Decision | Rationale |
|---|---|
| Component-based React architecture | Allows each part of the interface to have a focused responsibility. |
| UI-oriented folder hierarchy | Mirrors the visible application flow, making related code easier to locate and maintain. |
| Central API service | Keeps HTTP handling and backend endpoint definitions in one place. |
| Custom data-management hook | Centralizes data loading, caching, local updates, and persistence coordination. |
| Lazy loading | Avoids fetching every company's detailed information during initial startup. |
| Debounced saves | Reduces excessive network requests when users make rapid consecutive edits. |
| Separate document components | Keeps file operations and PDF display logic distinct from corporate data forms. |
| Dedicated AI assistant | Separates conversational interactions and context selection from the main details views. |
| Server-side change history | Enables reliable recovery and auditing beyond a single browser session. |
| Server-enforced authorization | Prevents unauthorized operations even when the frontend is bypassed. |

## 🧭 Development Principles

The following principles should guide further development:

1. **Follow the UI hierarchy:** Keep folders arranged in the same order as the visible application, with each section owning its related components and styling.
2. **Keep responsibilities focused:** Extract meaningful UI sections rather than creating files solely to reduce line counts.
3. **Keep persistence centralized:** Continue routing repository and meeting operations through the API service and data-management layer.
4. **Preserve data integrity:** Treat saving, deletion, undo, and concurrent editing as data-management concerns that require backend support.
5. **Enforce permissions server-side:** Frontend visibility is not a substitute for authorization.
6. **Design for collaboration:** Shared records should have clear update, conflict, and recovery behavior.
7. **Maintain testability:** Test data transformations, API operations, permission rules, and important record-editing workflows.

## 🎯 Conclusion

CS Repo provides a centralized interface for managing PFCCL subsidiary information, corporate records, board meeting activities, and supporting documents. Its existing architecture separates the company hierarchy, details workspace, document handling, meetings, shared UI, data coordination, and backend communication into focused responsibilities.

The next stage is to strengthen the platform with dependable undo and recovery, authenticated user access, role-based permissions, audit history, and safe multi-user editing. Combined with the existing repository and meeting workflows, these enhancements can help evolve CS Repo into a more reliable and collaborative corporate records management platform.

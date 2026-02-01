# Architecture Diagram: Ticket Creation Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OWASP RAT Modern App                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Frontend (React/Vite) - Port 5174                                      │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  ChecklistPage / SpvsRequirementsPage                             │ │
│  │  ├─ Select items (controls/requirements)                          │ │
│  │  ├─ Click "Send to ticket system"                                │ │
│  │  └─ Opens TicketModal/SpvsTicketModal                            │ │
│  │                                                                    │ │
│  │  TicketModal Component                                            │ │
│  │  ├─ LocalStorage: rally-workitem-id 💾                           │ │
│  │  ├─ Two Modes:                                                    │ │
│  │  │  ├─ CREATE: Form for new ticket                               │ │
│  │  │  │          Title, Description, Type                          │ │
│  │  │  │          POST /ticketing/rally/create →                    │ │
│  │  │  │                                                             │ │
│  │  │  └─ LINK: Enter existing work item ID                         │ │
│  │  │          POST /ticketing/rally/link →                         │ │
│  │  │                                                                │ │
│  │  └─ onSuccess callback returns ticket URL                        │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│           ↓ (API Calls with Bearer Token)                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    API Client (lib/api.ts)                         │ │
│  │                                                                    │ │
│  │  createRallyTicket({                                              │ │
│  │    ticketType,                                                    │ │
│  │    title,                                                         │ │
│  │    description,                                                   │ │
│  │    relatedItems,        ← Control/Requirement IDs                │ │
│  │    accessToken,         ← Bearer Token                            │ │
│  │    metadata             ← Context (role, level, etc.)            │ │
│  │  })                                                               │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
        ║
        ║ HTTPS
        ║
┌─────────────────────────────────────────────────────────────────────────┐
│                      Backend (Fastify) - Port 4000                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Ticketing Routes (routes/ticketing.ts)                                │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                                                                    │ │
│  │  POST /ticketing/rally/create                                     │ │
│  │  ├─ Validate Bearer token                                         │ │
│  │  ├─ Zod schema validation                                         │ │
│  │  └─ Call adapter.createTask()                                     │ │
│  │      ↓                                                             │ │
│  │                                                                    │ │
│  │  POST /ticketing/rally/link                                       │ │
│  │  ├─ Validate Bearer token                                         │ │
│  │  ├─ Zod schema validation                                         │ │
│  │  └─ Call adapter.linkTask()                                       │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│           ↓                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │              Ticketing Adapter (adapters/rallyAdapter.ts)          │ │
│  │                                                                    │ │
│  │  RallyAdapter implements TicketingAdapter                         │ │
│  │                                                                    │ │
│  │  createTask(payload, context)                                     │ │
│  │  ├─ Map ticketType to Rally artifact type:                       │ │
│  │  │  ├─ story → hierarchicalrequirement                           │ │
│  │  │  ├─ task → task                                               │ │
│  │  │  ├─ defect → defect                                           │ │
│  │  │  └─ epic → portfolioitem/feature                              │ │
│  │  │                                                                │ │
│  │  ├─ Build request body:                                          │ │
│  │  │  ├─ Name: title                                               │ │
│  │  │  ├─ Description: description                                  │ │
│  │  │  ├─ CustomFields:                                             │ │
│  │  │  │  ├─ OWASPGenerated__c: true                                │ │
│  │  │  │  ├─ UserRole__c: context.userRole                          │ │
│  │  │  │  └─ ...metadata                                            │ │
│  │  │  └─ RelatedItems: controlIds                                  │ │
│  │  │                                                                │ │
│  │  └─ POST to Rally API, return response                           │ │
│  │                                                                    │ │
│  │  linkTask(payload, context)                                       │ │
│  │  ├─ POST to Rally work item endpoint                             │ │
│  │  ├─ Set CustomFields with link metadata                          │ │
│  │  └─ Return success/error                                         │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│           ↓ (REST API Calls)                                             │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │           Rally Broadcom API (External Service)                    │ │
│  │           https://rally.broadcom.com/slm/webservice/...          │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
        ║
        ║
        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Rally Broadcom (External)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Rally Database                                                          │
│  ├─ User Stories                                                         │
│  ├─ Tasks                                                                │
│  ├─ Defects                                                              │
│  ├─ Epics                                                                │
│  └─ Custom Fields:                                                       │
│     ├─ OWASPGenerated: true                                              │
│     ├─ UserRole: developer                                               │
│     ├─ Level: L2                                                         │
│     └─ etc.                                                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Create Ticket Flow

```
User selects 3 ASVS controls
          ↓
    [Select: V2.1.1, V2.2.1, V2.3.1]
          ↓
   Click "Send to ticket system"
          ↓
   Modal opens (mode = "create")
          ↓
   User enters:
   - Type: "story"
   - Title: "Fix Authentication"
   - Description: "Address ASVS L2 auth"
          ↓
   Click "Create ticket"
          ↓
   Frontend API Call:
   POST /ticketing/rally/create
   {
     "ticketType": "story",
     "title": "Fix Authentication",
     "description": "Address ASVS L2 auth",
     "relatedItems": ["V2.1.1", "V2.2.1", "V2.3.1"],
     "metadata": {
       "level": "L2",
       "role": "developer",
       "controlCount": 3
     }
   }
   (with Bearer token)
          ↓
   Backend Route Handler:
   ├─ Validate token
   ├─ Validate payload
   └─ Call RallyAdapter.createTask()
          ↓
   RallyAdapter:
   ├─ Map "story" → "hierarchicalrequirement"
   ├─ Build Rally request
   └─ POST to Rally API
          ↓
   Rally:
   ├─ Create new user story
   ├─ Set custom fields
   ├─ Link related items
   └─ Return ticket ID + URL
          ↓
   Backend Response:
   {
     "id": "US123456",
     "url": "https://rally.broadcom.com/slm/webservice/...",
     "status": "created"
   }
          ↓
   Frontend Modal:
   ├─ Display success message
   ├─ Show ticket URL (clickable)
   ├─ Call onSuccess(ticketUrl)
   └─ Clear selection
          ↓
   User sees:
   ✓ Ticket created successfully!
   → View in Rally (clickable link)
```

---

### Link Existing Flow

```
User selects 2 SPVS requirements
          ↓
   [Select: PIPE-1, PIPE-2]
          ↓
   Click "Send to ticket system"
          ↓
   Modal opens (mode = "link")
          ↓
   User enters:
   - Work Item ID: "US789"
   - Type: "task"
   - Notes: "Link these to pipeline effort"
          ↓
   Click "Link requirements"
          ↓
   Frontend API Calls (parallel):
   
   POST /ticketing/rally/link
   {
     "taskId": "PIPE-1",
     "workItemId": "US789",
     "metadata": {
       "type": "task",
       "notes": "Link these to pipeline effort"
     }
   }
   
   POST /ticketing/rally/link
   {
     "taskId": "PIPE-2",
     "workItemId": "US789",
     "metadata": { ... }
   }
   
   (both with Bearer token)
          ↓
   Backend routes:
   ├─ Validate tokens
   ├─ Validate payloads
   └─ Call RallyAdapter.linkTask() for each
          ↓
   RallyAdapter (for each item):
   ├─ GET Rally work item (US789)
   ├─ Add custom fields to it
   └─ POST update back to Rally
          ↓
   Rally updates:
   US789 now has:
   - CustomField: LinkedPipeRequirements
   - CustomField: OWASP Source
   - RelatedItems: [PIPE-1, PIPE-2]
          ↓
   Backend Response (both): 204 No Content
          ↓
   Frontend Modal:
   ├─ Display success message
   ├─ Clear selection
   └─ localStorage still has "US789"
          ↓
   User sees:
   ✓ 2 requirements linked successfully!
   (next time they open modal, "US789" is still there)
```

---

## Storage & Persistence

### LocalStorage

```
Browser LocalStorage
├─ Key: "rally-workitem-id"
├─ Value: "US123456"
└─ Persists across:
   ├─ Modal open/close ✓
   ├─ Page navigation ✓
   ├─ Browser refresh ✓
   └─ Lost on: Private mode, manual clear, logout
```

### Session Storage (Auth)

```
Session Storage (existing)
├─ Key: "rallyAccessToken"
├─ Value: <JWT token>
└─ Used for all API requests
```

---

## Error Handling

```
User Action
   ↓
   ├─ Invalid input?
   │  └─ Show error message (client-side)
   │     ✗ "Please provide a work item ID"
   │
   ├─ Network error?
   │  └─ Catch in frontend
   │     ✗ "Failed to create Rally ticket: <error>"
   │
   ├─ Token expired?
   │  └─ API returns 401
   │     ✗ "Rally integration is disabled"
   │
   ├─ Rally API error?
   │  └─ Detailed error message
   │     ✗ "Failed to link Rally work item: <rally response>"
   │
   └─ Success?
      └─ Return ticket ID + URL
         ✓ Show success message
```

---

## API Response Types

### CreateRallyTicketResponse

```typescript
{
  id: string              // "US123456"
  url: string             // "https://rally.broadcom.com/..."
  status: "created"       // Always "created" on success
}
```

### Error Response

```typescript
{
  statusCode: number      // 400, 401, 500, etc
  error: string           // "Bad Request", "Unauthorized", etc
  message: string         // "Title is required"
}
```

---

## Component Relationships

```
App (Router)
├─ ChecklistPage
│  ├─ useAuth() → get rallyAccessToken
│  ├─ TicketModal
│  │  ├─ Select "create" or "link"
│  │  ├─ localStorage: rally-workitem-id
│  │  ├─ onCreateTicket: calls createRallyTicket()
│  │  ├─ onLinkExisting: calls linkTaskToRally()
│  │  └─ onSuccess: clears selection, shows URL
│  │
│  └─ ControlCard (for each control)
│     ├─ Click to select
│     └─ Shows in TicketModal summary
│
├─ SpvsRequirementsPage
│  ├─ useAuth() → get rallyAccessToken
│  ├─ SpvsTicketModal
│  │  ├─ (Same as TicketModal)
│  │  └─ Adapted for SPVS data
│  │
│  └─ RequirementCard (for each requirement)
│     ├─ Click to select
│     └─ Shows in SpvsTicketModal summary
│
└─ DashboardPage (unaffected)
```

---

## Environment Variables

### Frontend

```
VITE_API_BASE_URL=http://localhost:4000
VITE_MOCK_USER_ID=local-user          (optional)
VITE_MOCK_USER_NAME=Test User         (optional)
VITE_MOCK_USER_EMAIL=test@example.com (optional)
VITE_MOCK_USER_ROLE=developer         (optional)
```

### Backend

```
PORT=4000
HOST=0.0.0.0
CLIENT_ORIGIN=http://localhost:5174
RALLY_CLIENT_ID=<from Broadcom>
RALLY_CLIENT_SECRET=<from Broadcom>
RALLY_REDIRECT_URI=http://localhost:5174/oauth/callback
RALLY_AUTHORIZE_URL=<Rally OAuth URL>
RALLY_TOKEN_URL=<Rally token URL>
RALLY_API_BASE_URL=<Rally API URL>
```

---

## Performance Characteristics

### Latency

- **Create Ticket**: ~200-500ms (one API call)
- **Link One Item**: ~100-150ms per item
- **Link N Items**: ~100-150ms × N (could parallelize)
- **Modal Open**: ~50ms (localStorage lookup)

### Network

- **Request Size**: ~500 bytes typical
- **Response Size**: ~300 bytes typical
- **Encoding**: JSON, gzip compatible

### Storage

- **localStorage**: ~20 bytes for work item ID
- **sessionStorage**: ~1KB for access token

---

## Future Enhancements

```
Current Implementation
├─ Create ticket: ✓ Works
├─ Link existing: ✓ Works
├─ Persist state: ✓ Works
└─ Error handling: ✓ Works

Future Possibilities
├─ Auto-refresh tokens
├─ Progress indicators
├─ Batch parallelization
├─ Toast notifications
├─ Success/error modals
├─ Retry buttons
├─ Validation before submit
├─ Ticket templates
└─ Bulk operations
```

---

**Diagram Generated**: November 23, 2025
**System Status**: ✅ Complete and Running

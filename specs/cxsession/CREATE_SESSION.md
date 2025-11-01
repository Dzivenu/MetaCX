# Create Session Specification

## Overview
This document details the process and requirements for creating a new trading session in the MetaCX application. Session creation follows strict business rules to ensure data integrity and proper session lifecycle management.

## Business Rules

### Prerequisites for Session Creation
1. **User Authorization**: User must have appropriate permissions to create sessions
2. **Organization Context**: Session must be created within an active organization
3. **Previous Sessions**: Last 5 sessions must be closed before creating a new session
4. **Role Assignment**: Session must have a valid role (TELLER, MANAGER, or ADMIN)
5. **Branch Assignment**: Session must be associated with a branch

### Session Lifecycle States
```
DORMANT → FLOAT_OPEN_START → FLOAT_OPEN_COMPLETE → FLOAT_CLOSE_START → FLOAT_CLOSE_COMPLETE
```

### Validation Process
Before creating a session, the system must:

1. **Authenticate User**: Verify user is logged in and has session creation permissions
2. **Validate Organization**: Ensure user belongs to the target organization
3. **Check Previous Sessions**: Validate that the last 5 sessions are fully closed
4. **Validate Role**: Ensure provided role is valid (TELLER, MANAGER, ADMIN)
5. **Assign Branch**: Automatically assign to primary branch or specified branch

## Legacy System Analysis (Rails Backend)

### Backend Session Creation Flow

#### 1. Session Controller (`/app/controllers/api/v1/sessions_controller.rb`)
```ruby
def create
  authorize Session
  role = params[:role]
  service = SessionEngine::CreateSessionService.new(current_user, role)
  @session, error = service.call
  if error.nil?
    render :show
  else
    render json: { error: error }, status: :unprocessable_entity
  end
end
```

#### 2. Create Session Service (`/app/services/session_engine/create_session_service.rb`)
```ruby
class CreateSessionService
  def initialize(current_user, role)
    @session = nil
    @current_user = current_user
    @role = role
    @error = nil
    @branch = Branch.first
  end

  def call
    create_session
    [@session, @error]
  rescue StandardError => e
    @error = e
    [@session, @error]
  end

  private

  def create_session
    validate_last_sessions
    build_session
    @session.create_user_access_log(@current_user)
  end

  def validate_last_sessions
    last_sessions = Session.order(created_at: :desc).limit(5)
    unless last_sessions.all? { |session| session.state == 'FLOAT_CLOSE_COMPLETE' }
      throw 'Some of the last 5 sessions are not closed'
    end
  end

  def build_session
    @session = Session.create!(
      open_start_dt: Time.current,
      user: @current_user,
      branch: @branch,
      state: 'DORMANT',
      role: @role
    )
  end
end
```

#### 3. Session Model User Access Log Creation
```ruby
def create_user_access_log(user)
  throw 'User is not valid' if user.nil?

  log = self.session_access_log
  activity_event = 'SESSION_CREATED'

  if log.nil?
    log = SessionAccessLog.create!(
      start_dt: Time.current,
      start_owner_id: user.id,
      authorized_users: [user.id],
      session: self,
      branch: self.branch || Branch.first
    )
  else
    log.user_join_dt = Time.now
    log.user_join_id = user.id
    unless log.authorized_users.include?(user.id)
      log.authorized_users << user.id
    end
    log.save!
    activity_event = 'SESSION_JOINED'
  end

  user.update!(active_session_id: self.id)
  Activity.create_from_params(
    event: activity_event,
    user_id: user.id,
    session_id: self.id,
    reference_id: self.id,
    comment: '',
    meta: ''
  )
end
```

### Frontend Session Creation Flow

#### 1. Session API (`/src/apis/session.js`)
```javascript
// Select existing session or create new one
export const selectSession = (action, sessionData, payload) => {
  return new Promise((resolve, reject) => {
    const url = action === 'SELECT'
      ? `${sessionData.baseUrl}/api/v1/sessions/${payload.session_id}/select`
      : `${sessionData.baseUrl}/api/v1/sessions/create?role=${payload.role}`

    const headers = {
      'Content-Type': 'application/json',
      'X-User-Email': `${sessionData.userEmail}`,
      'X-User-Token': `${sessionData.userToken}`
    }

    fetch(url, {
      method: 'GET',
      headers: headers
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch. Status: ${res.status} - ${res.statusText}`)
        }
        return res.json()
      })
      .then(data => {
        resolve(data)
      })
      .catch(error => {
        reject(error)
      })
  })
}
```

#### 2. Session Data Helper (`/src/helpers/FloatData.js`)
```javascript
// Request session open
export const sessionRequestOpen = async sessionData => {
  const response = await fetch(
    `${sessionData.baseUrl}/api/v1/sessions/${sessionData.sessionID}/open_session`,
    {
      method: 'GET',
      headers: {
        'Content-type': 'application/json',
        'X-User-Email': `${sessionData.userEmail}`,
        'X-User-Token': `${sessionData.userToken}`
      }
    }
  )
  const data = await response.json()
  if (data.error) {
    console.log(data)
    AppToast(`Unable to open session #${sessionData.sessionID}`, 'error')
  } else {
    window.location.reload()
  }
}
```

## Technical Implementation (MetaCX/Convex)

### Backend Session Creation
```typescript
export const createSession = mutation({
  args: {
    clerkOrganizationId: v.string(),
    role: v.optional(v.string()),
    branchId: v.optional(v.id("org_branches")),
  },
  handler: async (ctx, args) => {
    // 1. Authenticate user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 2. Validate organization
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (q) => 
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .first();
    
    if (!organization) throw new Error("Organization not found");
    
    // 3. Validate role
    const validRoles = ["TELLER", "MANAGER", "ADMIN"];
    const role = args.role || "TELLER";
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
    }
    
    // 4. Validate last sessions are closed (Legacy rule)
    const lastSessions = await ctx.db
      .query("org_cx_sessions")
      .withIndex("by_clerk_org_id", (q) => 
        q.eq("clerkOrganizationId", args.clerkOrganizationId)
      )
      .order("desc")
      .take(5);
    
    const openSessions = lastSessions.filter(s => s.status !== "FLOAT_CLOSE_COMPLETE");
    if (openSessions.length > 0) {
      throw new Error("Some of the last 5 sessions are not closed");
    }
    
    // 5. Get or create default branch
    let branchId = args.branchId;
    if (!branchId) {
      const defaultBranch = await ctx.db
        .query("org_branches")
        .withIndex("by_clerk_org_id", (q) => 
          q.eq("clerkOrganizationId", args.clerkOrganizationId)
        )
        .first();
      
      if (!defaultBranch) {
        throw new Error("No branch found for organization");
      }
      branchId = defaultBranch._id;
    }
    
    // 6. Create new session
    const sessionId = await ctx.db.insert("org_cx_sessions", {
      clerkOrganizationId: args.clerkOrganizationId,
      userId: identity.subject,
      role: role,
      branchId: branchId,
      status: "DORMANT",
      openStartDt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 7. Create session access log
    await ctx.db.insert("org_cx_session_access_logs", {
      clerkOrganizationId: args.clerkOrganizationId,
      sessionId: sessionId,
      startDt: Date.now(),
      startOwnerId: identity.subject,
      authorizedUsers: [identity.subject],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // 8. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: args.clerkOrganizationId,
      userId: identity.subject,
      sessionId: sessionId,
      event: "SESSION_CREATED",
      referenceId: sessionId,
      comment: "",
      meta: "",
      createdAt: Date.now(),
    });
    
    return { success: true, sessionId };
  },
});
```

### Session Opening (Start Float)
```typescript
export const openSession = mutation({
  args: {
    sessionId: v.id("org_cx_sessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Get session
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    
    // 2. Validate session status
    if (session.status !== "DORMANT") {
      throw new Error("Session is not in DORMANT state");
    }
    
    // 3. Update session to FLOAT_OPEN_START
    await ctx.db.patch(args.sessionId, {
      status: "FLOAT_OPEN_START",
      openStartUserId: identity.subject,
      updatedAt: Date.now(),
    });
    
    // 4. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: session.clerkOrganizationId,
      userId: identity.subject,
      sessionId: args.sessionId,
      event: "SESSION_FLOAT_OPEN_STARTED",
      referenceId: args.sessionId,
      comment: "",
      meta: "",
      createdAt: Date.now(),
    });
    
    return { success: true, message: "Session opening started" };
  },
});
```

### Session Opening Confirmation
```typescript
export const confirmOpenSession = mutation({
  args: {
    sessionId: v.id("org_cx_sessions"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    // 1. Get session
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    
    // 2. Validate session status
    if (session.status !== "FLOAT_OPEN_START") {
      throw new Error("Session is not in FLOAT_OPEN_START state");
    }
    
    // 3. Validate all repositories are confirmed (if required)
    const repositories = await ctx.db
      .query("org_repositories")
      .withIndex("by_clerk_org_id", (q) => 
        q.eq("clerkOrganizationId", session.clerkOrganizationId)
      )
      .collect();
    
    const unconfirmedRepositories = repositories.filter(repo => 
      repo.floatCountRequired && !repo.openConfirmDt
    );
    
    if (unconfirmedRepositories.length > 0) {
      const repositoryNames = unconfirmedRepositories.map(r => r.name).join(", ");
      throw new Error(
        `Cannot confirm session opening: ${unconfirmedRepositories.length} repository(s) are not confirmed. Repository names: ${repositoryNames}`
      );
    }
    
    // 4. Update session to FLOAT_OPEN_COMPLETE
    await ctx.db.patch(args.sessionId, {
      status: "FLOAT_OPEN_COMPLETE",
      openConfirmDt: Date.now(),
      openConfirmUserId: identity.subject,
      updatedAt: Date.now(),
    });
    
    // 5. Log activity
    await ctx.db.insert("org_activities", {
      clerkOrganizationId: session.clerkOrganizationId,
      userId: identity.subject,
      sessionId: args.sessionId,
      event: "SESSION_FLOAT_OPEN_COMPLETED",
      referenceId: args.sessionId,
      comment: "",
      meta: "",
      createdAt: Date.now(),
    });
    
    return { success: true, message: "Session opening confirmed" };
  },
});
```

## Error Handling

### Validation Errors
- **Unauthorized**: "User is not authenticated or lacks permissions"
- **Organization Not Found**: "The specified organization could not be found"
- **Invalid Role**: "Invalid role. Must be one of: TELLER, MANAGER, ADMIN"
- **Previous Sessions Open**: "Some of the last 5 sessions are not closed"
- **Branch Not Found**: "No branch found for organization"
- **Session Not DORMANT**: "Session is not in DORMANT state"
- **Repository Floats**: "Cannot confirm session opening: X repository(s) are not confirmed"

### System Errors
- **Database Error**: "An error occurred while creating the session. Please try again"
- **Network Error**: "Failed to connect to the server. Please check your connection"

## User Interface Requirements

### Creation Flow
1. **Session Creation Form**: 
   - Role selection (TELLER, MANAGER, ADMIN)
   - Organization selection (if multiple)
   - Branch selection (optional, defaults to primary)
2. **Validation Feedback**: Real-time validation with clear error messages
3. **Success Notification**: "Session created successfully"
4. **Auto-redirect**: Redirect to session details or float page

### Opening Flow
1. **Start Opening Button**: Available for DORMANT sessions
2. **Float Counting Interface**: Repository float confirmation
3. **Confirm Opening Button**: Available when all required repos are confirmed
4. **Progress Indicators**: Clear status indicators throughout the process

## Integration Points

### Components Using Session Creation
1. **PortalSessionManager**: Session list with "Create New Session" button
2. **TopNavbarRight**: Session menu with "Create Session" option
3. **FloatPage**: Start opening flow for active sessions

### Shared Functions
- `createSession()` from session creation hook
- `openSession()` from session management hook
- `confirmOpenSession()` from session management hook

## Testing Requirements

### Unit Tests
- Test session creation with valid/invalid roles
- Test previous session validation logic
- Test organization validation
- Test branch assignment logic
- Test session access log creation
- Test activity logging

### Integration Tests
- Test complete session creation flow from UI
- Test session opening and confirmation flow
- Test error handling throughout the process
- Test permission validation

### Edge Cases
- User with multiple organizations
- No available branches
- Concurrent session creation attempts
- Network failures during creation
- Invalid role parameters

## Security Considerations

### Authorization
- Verify user has session creation permissions
- Validate user belongs to the target organization
- Prevent session creation across organizations

### Data Integrity
- Atomic session creation with access log
- Proper audit trail with activity logging
- Validation of all dependent data

## Performance Considerations

### Database Queries
- Efficient indexing on organization ID for session lookups
- Optimize previous session validation query
- Cache organization and branch data

### User Experience
- Fast validation feedback
- Clear progress indicators
- Graceful handling of network issues

## Migration Notes

### Legacy to MetaCX Differences
1. **Authentication**: Rails uses token auth vs MetaCX uses Clerk JWT
2. **Database**: Rails PostgreSQL vs MetaCX Convex
3. **Session States**: Rails uses underscores vs MetaCX may use camelCase
4. **Branch Management**: Legacy auto-selects first branch vs MetaCX may need explicit selection

### Preserved Legacy Logic
- Last 5 sessions validation rule
- Role-based session creation
- Session access log management
- Activity logging for audit trail
- Repository float validation for opening

## Future Enhancements

### Potential Improvements
1. **Session Templates**: Pre-configured session types with default settings
2. **Scheduled Sessions**: Allow scheduling session creation for future time
3. **Bulk Operations**: Create multiple sessions at once
4. **Session Cloning**: Create new session based on previous session configuration
5. **Advanced Branch Management**: Support for multiple branch selection

### Analytics
- Track session creation frequency and patterns
- Monitor common creation failure reasons
- Report on session lifecycle metrics
- User behavior analysis for session management

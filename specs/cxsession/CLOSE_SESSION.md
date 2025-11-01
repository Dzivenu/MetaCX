# Close Session Specification

## Overview
This document details the process and requirements for closing a trading session in the MetaCX application. The session closing process ensures data integrity by validating that all orders within the session are properly finalized before allowing the session to be closed.

## Business Rules

### Prerequisites for Session Closure
1. **Session Status**: The session must be in an active state (not already closed or cancelled)
2. **Order Validation**: ALL orders associated with the session must have a status of either:
   - `COMPLETED`
   - `CANCELLED`
3. **User Authorization**: User must have appropriate permissions to close sessions
4. **Repository Validation**: All repositories that require float counting must have confirmed close floats
5. **Previous Sessions**: Last 5 sessions must be closed (for new session creation)

### Validation Process
Before closing a session, the system must:

1. **Query Session Orders**: Retrieve all orders associated with the session ID
2. **Status Validation**: Check each order's status against the allowed final states
3. **Repository Float Validation**: Ensure all required repositories have confirmed close floats
4. **Fail Fast**: If any order has a status other than COMPLETED or CANCELLED, reject the closure
5. **User Feedback**: Provide clear error message indicating which orders prevent closure

## Technical Implementation

### Frontend Flow
1. User clicks "Close Session" button (available in:
   - Top navbar session menu
   - Session list page (extra menu)
   - Float page)
2. System validates session can be closed
3. If validation passes:
   - Show confirmation modal (optional)
   - Execute close session function
   - Show success notification
   - Refresh session data
4. If validation fails:
   - Show error notification with details
   - Keep session active

### Backend Validation (Convex Function)
```typescript
// Pseudo-code for validation logic
export const closeSession = mutation({
  args: { sessionId: v.id("org_cx_sessions") },
  handler: async (ctx, args) => {
    // 1. Get session
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    
    // 2. Check session status
    if (session.status === "CLOSED" || session.status === "CANCELLED") {
      throw new Error("Session is already closed");
    }
    
    // 3. Get all orders for the session
    const orders = await ctx.db
      .query("org_orders")
      .withIndex("by_org_session", (q) => 
        q.eq("orgSessionId", args.sessionId)
      )
      .collect();
    
    // 4. Validate all order statuses
    const incompleteOrders = orders.filter(order => 
      order.status !== "COMPLETED" && order.status !== "CANCELLED"
    );
    
    if (incompleteOrders.length > 0) {
      const orderIds = incompleteOrders.map(o => o._id).join(", ");
      throw new Error(
        `Cannot close session: ${incompleteOrders.length} order(s) are not completed or cancelled. Order IDs: ${orderIds}`
      );
    }
    
    // 5. Validate repository floats
    const repositories = await ctx.db
      .query("org_repositories")
      .withIndex("by_org_session", (q) => 
        q.eq("orgSessionId", args.sessionId)
      )
      .collect();
    
    const unconfirmedRepositories = repositories.filter(repository => 
      repository.floatCountRequired && !repository.closeConfirmDt
    );
    
    if (unconfirmedRepositories.length > 0) {
      const repositoryNames = unconfirmedRepositories.map(r => r.name).join(", ");
      throw new Error(
        `Cannot close session: ${unconfirmedRepositories.length} repository(s) are not confirmed. Repository names: ${repositoryNames}`
      );
    }
    
    // 6. Close the session
    await ctx.db.patch(args.sessionId, {
      status: "CLOSED",
      closeConfirmDt: Date.now(),
      updatedAt: Date.now(),
    });
    
    return { success: true, message: "Session closed successfully" };
  },
});
```

## Error Handling

### Validation Errors
- **Session Not Found**: "The specified session could not be found"
- **Already Closed**: "This session is already closed or cancelled"
- **Incomplete Orders**: "Cannot close session: X order(s) are not completed or cancelled. [Order details]"
- **Repository Floats**: "Can't confirm the closing float until all required repositories are confirmed: [Repo names]"
- **Previous Sessions Open**: "Some of the last 5 sessions are not closed"

### System Errors
- **Permission Denied**: "You do not have permission to close this session"
- **Database Error**: "An error occurred while closing the session. Please try again"

## User Interface Requirements

### Success States
- Green notification: "Session closed successfully"
- Automatic refresh of session data
- Update of session status in UI components

### Error States
- Red notification with specific error message
- Session remains active
- Detailed information about blocking orders/repositories (if applicable)

## Integration Points

### Components Using Close Session
1. **TopNavbarRight**: Session dropdown menu
2. **PortalSessionManager**: Session list extra menu
3. **FloatPage**: Close session button (existing)

### Shared Function
All components use `clearActiveSession()` from `ActiveSessionProvider` which calls the Convex `closeSession` mutation.

## Testing Requirements

### Unit Tests
- Test validation logic with various order status combinations
- Test error handling for different failure scenarios
- Test successful closure flow
- Test repository float validation
- Test previous session validation for creation

### Integration Tests
- Test close session from all UI entry points
- Test session state updates across components
- Test permission validation
- Test session creation with validation

### Edge Cases
- Session with no orders
- Session with mixed completed/incomplete orders
- Concurrent session closure attempts
- Network failures during closure
- Repository float counting scenarios

## Security Considerations

### Authorization
- Verify user has session management permissions
- Validate user belongs to the session's organization
- Audit log of session closure actions

### Data Integrity
- Atomic operation to prevent partial state updates
- Validation of all dependent data before closure
- Rollback capability if closure fails

## Performance Considerations

### Database Queries
- Efficient indexing on session ID for order lookups
- Consider pagination for sessions with large numbers of orders
- Cache validation results where appropriate

### User Experience
- Fast validation feedback
- Clear progress indication for long-running operations
- Graceful handling of network issues

## Future Enhancements

### Potential Improvements
1. **Bulk Order Completion**: Option to complete/cancel remaining orders before closing
2. **Session Closure Report**: Generate summary report of closed session
3. **Scheduled Closure**: Allow scheduling session closure for future time
4. **Closure Approval Workflow**: Require manager approval for session closure
5. **Repository Float Simplification**: Streamline repository float validation process

### Analytics
- Track session closure frequency and patterns
- Monitor common closure failure reasons
- Report on session lifecycle metrics

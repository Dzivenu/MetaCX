import { CxSessionModel } from "../CxSessionModel";

// Example usage of CxSessionModel

export async function exampleUsage() {
  try {
    // 1. Create a new session with data
    const session1 = new CxSessionModel({
      userId: 123,
      organizationId: 456,
      status: "pending"
    });
    
    await session1.save();
    console.log("Created session:", session1.toJSON());

    // 2. Create using static create method
    const session2 = await CxSessionModel.create({
      userId: 789,
      organizationId: 456,
      status: "pending"
    });
    console.log("Created session via static method:", session2.toJSON());

    // 3. Load existing session by ID
    const existingSession = new CxSessionModel(session1.get("id"));
    await existingSession.load();
    console.log("Loaded session:", existingSession.toJSON());

    // 4. Find session by ID
    const foundSession = await CxSessionModel.find(session1.get("id"));
    if (foundSession) {
      console.log("Found session:", foundSession.toJSON());
    }

    // 5. Find sessions by organization
    const orgSessions = await CxSessionModel.findByOrganization(456);
    console.log(`Found ${orgSessions.length} sessions for organization 456`);

    // 6. Find sessions by user
    const userSessions = await CxSessionModel.findByUser(123);
    console.log(`Found ${userSessions.length} sessions for user 123`);

    // 7. Use custom session methods
    const sessionToOpen = new CxSessionModel({
      userId: 999,
      organizationId: 456
    });
    await sessionToOpen.save();

    // Open the session
    await sessionToOpen.open(999);
    console.log("Session opened:", sessionToOpen.get("openStartDt"));

    // Confirm opening
    await sessionToOpen.confirmOpen(999);
    console.log("Session opening confirmed:", sessionToOpen.get("openConfirmDt"));

    // Close the session
    await sessionToOpen.close(999);
    console.log("Session closed:", sessionToOpen.get("closeStartDt"));

    // Confirm closing
    await sessionToOpen.confirmClose(999);
    console.log("Session closing confirmed:", sessionToOpen.get("closeConfirmDt"));

    // Verify the session
    await sessionToOpen.verify(888);
    console.log("Session verified by user:", sessionToOpen.get("verifiedByUserId"));

    // 8. Check session status
    console.log("Is session open?", sessionToOpen.isOpen);
    console.log("Is session closed?", sessionToOpen.isClosed);
    console.log("Is session verified?", sessionToOpen.isVerified);
    console.log("Session duration (minutes):", sessionToOpen.duration);

    // 9. Query methods
    const allSessions = await CxSessionModel.all({ limit: 10 });
    console.log(`Total sessions (limited to 10): ${allSessions.length}`);

    const openSessions = await CxSessionModel.findOpenSessions();
    console.log(`Open sessions: ${openSessions.length}`);

    const verifiedSessions = await CxSessionModel.findVerifiedSessions();
    console.log(`Verified sessions: ${verifiedSessions.length}`);

    // 10. Count sessions
    const totalCount = await CxSessionModel.count();
    console.log(`Total sessions in database: ${totalCount}`);

    const orgCount = await CxSessionModel.count({ organizationId: 456 });
    console.log(`Sessions for organization 456: ${orgCount}`);

    // 11. Update session
    session1.set("status", "updated");
    await session1.save();
    console.log("Updated session status:", session1.get("status"));

    // 12. Validation example
    const invalidSession = new CxSessionModel({
      status: "invalid_status" // This should fail validation
    });

    if (!invalidSession.isValid) {
      console.log("Validation errors:", invalidSession.errors);
    }

    // 13. Delete session
    await session2.destroy();
    console.log("Session deleted");

  } catch (error) {
    console.error("Example error:", error);
  }
}

// Usage patterns:

// Pattern 1: Create with data
// const session = new CxSessionModel({ userId: 123, organizationId: 456 });
// await session.save();

// Pattern 2: Create with ID (for loading)
// const session = new CxSessionModel("session-id-here");
// await session.load();

// Pattern 3: Static create
// const session = await CxSessionModel.create({ userId: 123 });

// Pattern 4: Static find
// const session = await CxSessionModel.find("session-id");

// Pattern 5: Query methods
// const sessions = await CxSessionModel.where({ userId: 123 });
// const sessions = await CxSessionModel.findByOrganization(456);
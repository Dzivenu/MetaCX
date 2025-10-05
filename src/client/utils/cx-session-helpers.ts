import { CxSession } from "@/client/api/cx-sessions";

// Helper functions for working with CX Sessions

export const sessionHelpers = {
  // Check if session is currently open
  isSessionOpen(session: CxSession): boolean {
    return !!session.openStartDt && !session.closeStartDt;
  },

  // Check if session is closed
  isSessionClosed(session: CxSession): boolean {
    return !!session.closeStartDt;
  },

  // Check if session is verified
  isSessionVerified(session: CxSession): boolean {
    return !!session.verifiedDt && !!session.verifiedByUserId;
  },

  // Get session duration in minutes (if closed)
  getSessionDuration(session: CxSession): number | null {
    if (!session.openStartDt || !session.closeStartDt) {
      return null;
    }
    
    const start = new Date(session.openStartDt);
    const end = new Date(session.closeStartDt);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  },

  // Get session status display text
  getStatusDisplay(session: CxSession): string {
    if (session.status) {
      return session.status;
    }
    
    if (this.isSessionClosed(session)) {
      return "Closed";
    }
    
    if (this.isSessionOpen(session)) {
      return "Open";
    }
    
    return "Pending";
  },

  // Format datetime for display
  formatDateTime(date: Date | string | null): string {
    if (!date) return "N/A";
    
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString();
  },

  // Get sessions by organization
  filterByOrganization(sessions: CxSession[], organizationId: number): CxSession[] {
    return sessions.filter(session => session.organizationId === organizationId);
  },

  // Get sessions by user
  filterByUser(sessions: CxSession[], userId: number): CxSession[] {
    return sessions.filter(session => session.userId === userId);
  },

  // Get sessions within date range
  filterByDateRange(
    sessions: CxSession[], 
    startDate: Date, 
    endDate: Date
  ): CxSession[] {
    return sessions.filter(session => {
      const sessionDate = new Date(session.createdAt);
      return sessionDate >= startDate && sessionDate <= endDate;
    });
  },

  // Get open sessions
  getOpenSessions(sessions: CxSession[]): CxSession[] {
    return sessions.filter(session => this.isSessionOpen(session));
  },

  // Get closed sessions
  getClosedSessions(sessions: CxSession[]): CxSession[] {
    return sessions.filter(session => this.isSessionClosed(session));
  },

  // Get verified sessions
  getVerifiedSessions(sessions: CxSession[]): CxSession[] {
    return sessions.filter(session => this.isSessionVerified(session));
  },

  // Calculate total duration for multiple sessions
  getTotalDuration(sessions: CxSession[]): number {
    return sessions.reduce((total, session) => {
      const duration = this.getSessionDuration(session);
      return total + (duration || 0);
    }, 0);
  },

  // Group sessions by status
  groupByStatus(sessions: CxSession[]): Record<string, CxSession[]> {
    return sessions.reduce((groups, session) => {
      const status = this.getStatusDisplay(session);
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(session);
      return groups;
    }, {} as Record<string, CxSession[]>);
  },

  // Get session statistics
  getSessionStats(sessions: CxSession[]) {
    const total = sessions.length;
    const open = this.getOpenSessions(sessions).length;
    const closed = this.getClosedSessions(sessions).length;
    const verified = this.getVerifiedSessions(sessions).length;
    const totalDuration = this.getTotalDuration(sessions);
    const averageDuration = closed > 0 ? totalDuration / closed : 0;

    return {
      total,
      open,
      closed,
      verified,
      totalDuration,
      averageDuration: Math.round(averageDuration),
    };
  },
};
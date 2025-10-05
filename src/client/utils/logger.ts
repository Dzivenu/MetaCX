/**
 * Enhanced logging system for debugging React infinite loops and state issues
 */

interface LogContext {
  component?: string;
  action?: string;
  props?: any;
  state?: any;
  error?: any;
  stack?: string;
  timestamp?: number;
}

class Logger {
  private isDev = process.env.NODE_ENV === "development";
  private logs: Array<LogContext & { level: string; message: string }> = [];
  private maxLogs = 1000;

  private formatMessage(
    level: string,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const component = context?.component ? `[${context.component}]` : "";
    return `${timestamp} ${level.toUpperCase()} ${component} ${message}`;
  }

  private addLog(level: string, message: string, context?: LogContext) {
    const logEntry = {
      level,
      message,
      timestamp: Date.now(),
      ...context,
    };

    this.logs.push(logEntry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  error(message: string, context?: LogContext) {
    this.addLog("error", message, context);
    if (this.isDev) {
      console.group(`🔴 ERROR: ${message}`);
      console.error(this.formatMessage("error", message, context));
      if (context?.error) console.error("Error object:", context.error);
      if (context?.stack) console.error("Stack trace:", context.stack);
      if (context?.props) console.error("Props:", context.props);
      if (context?.state) console.error("State:", context.state);
      console.groupEnd();
    }
  }

  warn(message: string, context?: LogContext) {
    this.addLog("warn", message, context);
    if (this.isDev) {
      console.group(`🟡 WARN: ${message}`);
      console.warn(this.formatMessage("warn", message, context));
      if (context?.props) console.warn("Props:", context.props);
      if (context?.state) console.warn("State:", context.state);
      console.groupEnd();
    }
  }

  info(message: string, context?: LogContext) {
    this.addLog("info", message, context);
    if (this.isDev) {
      console.info(`ℹ️ ${this.formatMessage("info", message, context)}`);
      if (context?.props) console.info("Props:", context.props);
      if (context?.state) console.info("State:", context.state);
    }
  }

  debug(message: string, context?: LogContext) {
    this.addLog("debug", message, context);
    if (this.isDev) {
      console.debug(`🔍 ${this.formatMessage("debug", message, context)}`);
      if (context?.props) console.debug("Props:", context.props);
      if (context?.state) console.debug("State:", context.state);
    }
  }

  // Special method for tracking component renders
  render(component: string, props?: any, state?: any) {
    const renderCount =
      this.logs.filter(
        (log) => log.component === component && log.action === "render"
      ).length + 1;

    if (renderCount > 10) {
      this.warn(
        `Component ${component} has rendered ${renderCount} times - possible infinite loop`,
        {
          component,
          action: "render",
          props,
          state,
          renderCount,
        }
      );
    } else {
      this.debug(`Component ${component} render #${renderCount}`, {
        component,
        action: "render",
        props,
        state,
        renderCount,
      });
    }
  }

  // Method to track state changes
  stateChange(component: string, field: string, oldValue: any, newValue: any) {
    this.debug(`State change in ${component}: ${field}`, {
      component,
      action: "state_change",
      state: {
        field,
        oldValue,
        newValue,
        changed: oldValue !== newValue,
      },
    });
  }

  // Method to track prop changes
  propChange(component: string, field: string, oldValue: any, newValue: any) {
    this.debug(`Prop change in ${component}: ${field}`, {
      component,
      action: "prop_change",
      props: {
        field,
        oldValue,
        newValue,
        changed: oldValue !== newValue,
      },
    });
  }

  // Get recent logs for debugging
  getRecentLogs(count = 50) {
    return this.logs.slice(-count);
  }

  // Get logs by component
  getComponentLogs(component: string) {
    return this.logs.filter((log) => log.component === component);
  }

  // Clear logs
  clear() {
    this.logs = [];
  }

  // Export logs for analysis
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Global logger instance
export const logger = new Logger();

// React hook for component logging
export function useComponentLogger(componentName: string) {
  const logRender = (props?: any, state?: any) => {
    logger.render(componentName, props, state);
  };

  const logError = (message: string, error?: any) => {
    logger.error(message, {
      component: componentName,
      error,
      stack: error?.stack,
    });
  };

  const logStateChange = (field: string, oldValue: any, newValue: any) => {
    logger.stateChange(componentName, field, oldValue, newValue);
  };

  const logPropChange = (field: string, oldValue: any, newValue: any) => {
    logger.propChange(componentName, field, oldValue, newValue);
  };

  return {
    logRender,
    logError,
    logStateChange,
    logPropChange,
    info: (message: string, context?: any) =>
      logger.info(message, { component: componentName, ...context }),
    warn: (message: string, context?: any) =>
      logger.warn(message, { component: componentName, ...context }),
    debug: (message: string, context?: any) =>
      logger.debug(message, { component: componentName, ...context }),
  };
}

export default logger;


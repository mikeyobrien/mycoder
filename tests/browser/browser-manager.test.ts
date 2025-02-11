import { BrowserManager } from '../../src/tools/browser/browser-manager';
import { BrowserError, BrowserErrorCode } from '../../src/tools/browser/types';

describe('BrowserManager', () => {
  let browserManager: BrowserManager;

  beforeEach(() => {
    browserManager = new BrowserManager();
  });

  afterEach(async () => {
    await browserManager.closeAllSessions();
  });

  describe('createSession', () => {
    it('should create a new browser session', async () => {
      const session = await browserManager.createSession();
      expect(session.id).toBeDefined();
      expect(session.browser).toBeDefined();
      expect(session.page).toBeDefined();
    });

    it('should create a headless session when specified', async () => {
      const session = await browserManager.createSession({ headless: true });
      expect(session.id).toBeDefined();
      // Additional headless mode checks could be added here
    });

    it('should apply custom timeout when specified', async () => {
      const customTimeout = 50000;
      const session = await browserManager.createSession({
        defaultTimeout: customTimeout
      });
      expect(session.page.getDefaultTimeout()).toBe(customTimeout);
    });
  });

  describe('closeSession', () => {
    it('should close an existing session', async () => {
      const session = await browserManager.createSession();
      await browserManager.closeSession(session.id);
      
      expect(() => {
        browserManager.getSession(session.id);
      }).toThrow(BrowserError);
    });

    it('should throw error when closing non-existent session', async () => {
      await expect(browserManager.closeSession('invalid-id'))
        .rejects
        .toThrow(new BrowserError(
          'Session not found',
          BrowserErrorCode.SESSION_ERROR
        ));
    });
  });

  describe('getSession', () => {
    it('should return existing session', async () => {
      const session = await browserManager.createSession();
      const retrieved = browserManager.getSession(session.id);
      expect(retrieved).toBe(session);
    });

    it('should throw error for non-existent session', () => {
      expect(() => {
        browserManager.getSession('invalid-id');
      }).toThrow(new BrowserError(
        'Session not found',
        BrowserErrorCode.SESSION_ERROR
      ));
    });
  });
});
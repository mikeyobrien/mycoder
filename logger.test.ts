import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from './logger.js';

describe('Logger', () => {
  let consoleSpy: {
    debug: vi.SpyInstance;
    verbose: vi.SpyInstance;
    info: vi.SpyInstance;
    warn: vi.SpyInstance;
    error: vi.SpyInstance;
  };

  beforeEach(() => {
    // Setup console spies before each test
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      verbose: vi.spyOn(console, 'log').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    // Clean up spies after each test
    vi.restoreAllMocks();
  });

  describe('Basic logging functionality', () => {
    let logger: Logger;

    beforeEach(() => {
      logger = new Logger({ name: 'TestLogger', logLevel: 'debug' });
    });

    it('should log debug messages', () => {
      logger.debug('This is a debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith(expect.stringContaining('This is a debug message'));
    });

    it('should log verbose messages', () => {
      logger.verbose('This is a verbose message');
      expect(consoleSpy.verbose).toHaveBeenCalledWith(expect.stringContaining('This is a verbose message'));
    });

    it('should log info messages', () => {
      logger.info('This is an info message');
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('This is an info message'));
    });

    it('should log warning messages', () => {
      logger.warn('This is a warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringContaining('This is a warning message'));
    });

    it('should log error messages', () => {
      logger.error('This is an error message');
      expect(consoleSpy.error).toHaveBeenCalledWith(expect.stringContaining('This is an error message'));
    });

    it('should include logger name in messages', () => {
      logger.info('Test message');
      expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringContaining('TestLogger'));
    });
  });

  describe('Nested logger functionality', () => {
    let parentLogger: Logger;
    let childLogger: Logger;

    beforeEach(() => {
      parentLogger = new Logger({ name: 'ParentLogger', logLevel: 'debug' });
      childLogger = new Logger({ name: 'ChildLogger', parent: parentLogger, logLevel: 'debug' });
    });

    it('should log nested debug messages with parent context', () => {
      childLogger.debug('This is a nested debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('ParentLogger:ChildLogger')
      );
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('This is a nested debug message')
      );
    });

    it('should log nested verbose messages with parent context', () => {
      childLogger.verbose('This is a nested verbose message');
      expect(consoleSpy.verbose).toHaveBeenCalledWith(
        expect.stringContaining('ParentLogger:ChildLogger')
      );
    });

    it('should log nested info messages with parent context', () => {
      childLogger.info('This is a nested info message');
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('ParentLogger:ChildLogger')
      );
    });

    it('should log nested warning messages with parent context', () => {
      childLogger.warn('This is a nested warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('ParentLogger:ChildLogger')
      );
    });

    it('should log nested error messages with parent context', () => {
      childLogger.error('This is a nested error message');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('ParentLogger:ChildLogger')
      );
    });

    it('should respect parent logger level settings', () => {
      parentLogger = new Logger({ name: 'ParentLogger', logLevel: 'warn' });
      childLogger = new Logger({ name: 'ChildLogger', parent: parentLogger, logLevel: 'debug' });
      
      childLogger.debug('Should not be logged');
      childLogger.info('Should not be logged');
      childLogger.warn('Should be logged');
      childLogger.error('Should be logged');

      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });
});
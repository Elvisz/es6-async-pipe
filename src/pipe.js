const reg4Define = /this\s*\.\s*define\s*\(\s*['"]([^\s\)'"]+)['"]\s*\)/;
const reg4notVoidFn = /this\.(goto|done|cancel|next)\(([^\)]*)\)/;

const symbol4done = Symbol('done');
const symbol4next = Symbol('next');
const symbol4null = Symbol('null');
const symbol4timestamp = Symbol('timestamp');

const noop = function noop() {};

function fetch(array, index) {
  if (index < 0 || index > array.length - 1) {
    throw new RangeError('Array index out of range.');
  }

  return array[index];
}

function promise(host) {
  if (host[symbol4next] in host.definitions) {
    host.current = host.definitions[host[symbol4next]];
    host[symbol4next] = symbol4null;
  } else {
    host.current++;
    if (host.current === host.handlers.length) {
      return Promise.resolve(symbol4done);
    }
  }

  const handler = fetch(host.handlers, host.current);

  if (typeof handler !== 'function') {
    throw new TypeError('pipe: handler should be a function.');
  }

  return new Promise((resolve, reject) => {
    if (reg4notVoidFn.test(handler.toString())) {
      if (host.debug) {
        host.logger.count('Data before async pipe handler');
        host.logger.log(host.value);
        host[symbol4timestamp] = Date.now();
      }

      host.beforeEach.apply(null, host.value);
      handler.apply({
        define: noop,

        goto: (define, ...args) => {
          host[symbol4next] = define;
          resolve(args);
        },

        next: (...args) => {
          resolve(args);
        },

        done: () => {
          resolve(symbol4done);
        },

        cancel: (reason) => {
          reject({
            handler,
            reason
          });
        },

        toString: () => {
          'PipeFunction';
        }
      }, host.value);
    } else {
      // void handler
      handler.apply(null, host.value);
      resolve.apply(null, host.value);
    }
  });
}

function* runloop() {
  while (true) {
    yield promise(this).then((parameters) => {
      if (parameters !== symbol4done) {
        this.value = parameters;
        this.afterEach.apply(null, this.value);
        if (this.debug) {
          this.logger.count('Data after async pipe handler');
          this.logger.log(parameters);
          this.logger.log(`Spent ${Date.now() - this[symbol4timestamp]} ms`);
        }

        this.next();
      } else {
        this.success.apply(null, this.value);
        this.after(this.value);
        if (this.debug) {
          this.logger.log('----------------------------------------');
          this.logger.log('Data finally processed as: ');
          this.logger.log(this.value);
          this.logger.groupEnd();
          this[symbol4timestamp] = null;
        }
      }
    }).catch((reason) => {
      this.failure(reason);
      this.after();
      if (this.debug) {
        this.logger.log('----------------------------------------');
        this.logger.log('Exceptions occurred: ');
        this.logger.log(reason);
        this.logger.groupEnd();
        this[symbol4timestamp] = null;
      }
    });
  }
}

function burner(...args) {
  // cache the return value from latest handler
  let value = [];
  let handlers = args;

  if (typeof args[0] !== 'function') {
    // allow first parameter as the initial value for following handlers
    value = [args[0]];
    handlers = args.slice(1);
  }

  const definitions = {};
  const total = handlers.length;
  let i = 0;
  let define;

  while (i < total) {
    // find first this.define(...)
    define = handlers[i].toString().match(reg4Define);

    // get the define name
    define = define && 'length' in define ? define[1] : define;

    // cache the define for this.goto(name), if define name duplicate, we ignore it.
    if (define && !(define in definitions)) {
      definitions[define] = i;
    }

    i++;
  }

  const host = {
    [symbol4timestamp]: null,
    debug: false,
    value,
    handlers, // functions will be burn in the queue
    success: noop,
    failure: noop,
    before: noop,
    after: noop,
    beforeEach: noop,
    afterEach: noop,
    definitions,
    current: -1
  };

  const burn = runloop.call(host);
  host.next = () => {
    burn.next();
  };

  return host;
}

export default function pipe(...args) {
  const host = burner(...args);

  class Pipe {
    constructor() {
      const timeout = window.setTimeout(() => {
        window.clearTimeout(timeout);
        if (host.debug) {
          host.logger.group('Async pipe begin');
        }

        host.before();
        host.next();
      }, 0);
    }

    before(fn) {
      host.before = fn;
      return this;
    }

    after(fn) {
      host.after = fn;
      return this;
    }

    beforeEach(fn) {
      host.beforeEach = fn;
      return this;
    }

    afterEach(fn) {
      host.afterEach = fn;
      return this;
    }

    done(fn) {
      host.success = fn;
      return this;
    }

    catch(fn) {
      host.failure = fn;
      return this;
    }

    debug(bool, logger) {
      host.debug = !!bool;
      host.logger = logger || console;
      return this;
    }
  }

  return new Pipe();
}

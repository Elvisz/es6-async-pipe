const reg4Define = /this\s*\.\s*define\s*\(\s*['"]([^\s\)'"]+)['"]\s*\)/;
const reg4notVoidFn = /this\.(goto|done|cancel|next)\(([^\)]*)\)/;

const symbol4done = Symbol('done');
const symbol4next = Symbol('next');
const symbol4null = Symbol('null');

let Global;

if (typeof self === 'object') {
  Global = self;
} else if (typeof global === 'object') {
  Global = global;
} else if (typeof window === 'object') {
  Global = window;
} else {
  throw new Error('No runtime!');
}

class PipeControl {
  constructor(iterator, resolve, reject) {
    Object.assign(this, {
      define() {},

      goto(define, ...args) {
        if (typeof define !== 'string') {
          throw new TypeError('pipe#goto(define, ...args): define should be a string.');
        }
        iterator[symbol4next] = define;
        iterator.afterEach();
        resolve(args);
      },

      done() {
        resolve(symbol4done);
      },

      cancel(reason) {
        reject({
          handler: iterator.current(),
          reason
        });
      },

      next() {
        iterator.afterEach();
        iterator.next();
      }
    });
  }
}

function promise(iterator) {
  if (iterator.at === iterator.size) {
    return Promise.resolve(symbol4done);
  }

  return new Promise((resolve, reject) => {
    const handler = iterator.current();

    iterator.beforeEach();
    if (reg4notVoidFn.test(handler.toString())) {
      handler.apply(new PipeControl(iterator, resolve, reject), iterator.value);
    } else {
      // void handler
      handler.apply(null, iterator.value);
      // resolver only accept one parameter
      resolve(iterator.value);
    }
  });
}

function* runloop(iterator) {
  while (true) {
    yield promise(iterator).then((parameters) => {
      if (parameters !== symbol4done) {
        iterator.value = parameters;
        iterator.next();
      } else {
        iterator.onComplete();
      }
    }).catch((reason) => {
      iterator.onError(reason);
    });
  }
}

class Iterator {
  runloop = null;
  timestamp = null;
  at = -1;
  debug = false;
  value = null;
  handlers = [];
  definitions = {};
  log = [];

  constructor(...args) {
    let i = 0;
    let define;

    Object.defineProperties(this, {
      size: {
        configurable: false,
        get() {
          return this.handlers.length;
        }
      }
    });

    this.handlers = args;

    if (typeof args[0] !== 'function') {
      // allow first parameter as the initial value for following handlers
      this.value = [args[0]];
      this.handlers.shift();
    }

    // get all named pipe function
    while (i < this.size) {
      // find first this.define(...)
      define = this.handlers[i].toString().match(reg4Define);

      // get the define name
      define = define ? define[1] : define;

      // cache the define for this.goto(name), if define name duplicate, we ignore it.
      if (define && !(define in this.definitions)) {
        this.definitions[define] = i;
      }

      i++;
    }

    this.runloop = runloop(this);
  }

  next() {
    const define = this[symbol4next];

    if (define in this.definitions) {
      this.at = this.definitions[define];
      this[symbol4next] = symbol4null;
    } else {
      this.at++;
    }

    this.runloop.next();
  }

  current() {
    if (this.at < 0 || this.at > this.size - 1) {
      throw new RangeError('Array index out of range.');
    }

    const handler = this.handlers[this.at];

    if (typeof handler !== 'function') {
      throw new TypeError('pipe: handler should be a function.');
    }

    return handler;
  }

  _onComplete() {}

  _onError() {}

  _before() {}

  _after() {}

  _beforeEach() {}

  _afterEach() {}

  _debug() {}

  onComplete(...args) {
    this.reporter('Async pipe completed');
    this._onComplete(this.value);
    this.after();
  }

  onError() {
    this.reporter('Async pipe occur some exception');
    this._onError(this.value);
    this.after();
  }

  before() {
    this._before(this.value);
  }

  after() {
    this._after(this.value);
    this._debug(this.log);
    this.log.push(`---------------------------------------------`);
    this.log.push(`Time total(ms): ${Date.now() - this.timestamp}`);
    this.log.push(`└ value final: ${JSON.stringify(this.value)}`);
    this.log = [];
    this.timestamp = null;
  }

  beforeEach() {
    this.reporter('Enter pipe function');
    this._beforeEach(this.value);
  }

  afterEach() {
    this.reporter('Exit pipe function');
    this._afterEach(this.value);
  }

  reporter(log) {
    if (this.debug) {
      this.log.push(`${log}`);
      this.log.push(`├ Time offset(ms): ${Date.now() - this.timestamp}`);
      this.log.push(`└ Value snapshot: ${JSON.stringify(this.value)}`);
    }
  }
}

class Pipe {
  constructor(iterator) {
    Object.assign(this, {
      before(fn) {
        iterator._before = fn;
        return this;
      },

      after(fn) {
        iterator._after = fn;
        return this;
      },

      beforeEach(fn) {
        iterator._beforeEach = fn;
        return this;
      },

      afterEach(fn) {
        iterator._afterEach = fn;
        return this;
      },

      done(fn) {
        iterator._onComplete = fn;
        return this;
      },

      catch(fn) {
        iterator._onError = fn;
        return this;
      },

      debug(fn) {
        iterator.debug = true;
        iterator._debug = fn;
        return this;
      }
    });

    // invoke all pipe functions after all sync statements done
    const start = Global.setTimeout(() => {
      Global.clearTimeout(start);
      iterator.timestamp = Date.now();
      iterator.before();
      iterator.next();
    }, 0);
  }
}

export default function pipe(...args) {
  const iterator = new Iterator(...args);
  return new Pipe(iterator);
}

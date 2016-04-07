const reg4Define = /this\s*\.\s*define\s*\(\s*['"]([^\s\)'"]+)['"]\s*\)/;
const reg4notVoidFn = /this\.(goto|done|cancel|next)\(([^\)]*)\)/;

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

function deferral(context, fn, ...args) {
  const timeout = Global.setTimeout(()=> {
    Global.clearTimeout(timeout);
    fn.apply(context, args);
  }, 0);
}

function* runloop(iterator) {
  while (true) {
    yield iterator.promise().then(iterator.resolve.bind(iterator)).catch(iterator.reject.bind(iterator));
  }
}

class PipeFunction {
  constructor(iterator, resolve, reject) {
    const PipeControl = {
      next(...args){
        iterator.afterEach();
        iterator.current++;
        resolve.apply(null, args);
      },
      goto(define, ...args){
        iterator.afterEach();
        if (typeof define !== 'string') {
          throw new TypeError('pipe#goto(define, ...args): define should be a string.');
        }

        if (define in iterator.namedPipeFunctions) {
          iterator.current = iterator.namedPipeFunctions[define];
          resolve.apply(null, args);
        }
      },
      done(){
        iterator.afterEach();
        iterator.current = iterator.size;
        resolve.apply(null, iterator.value);
      },
      cancel(...args){
        iterator.afterEach();
        reject.apply(null, args);
      }
    };

    Object.assign(this, PipeControl);
  }

  define() {}
}

class Iterator {
  current = 0;
  value = undefined;
  handlers = [];
  debug = false;
  namedPipeFunctions = {};
  timestamp = null;
  logs = [];

  constructor(...args) {
    this.handlers = args;

    Object.defineProperties(this, {
      size: {
        get(){
          return this.handlers.length;
        }
      },
      handler: {
        get(){
          if (this.current > -1 && this.current < this.size) {
            return this.handlers[this.current];
          } else {
            throw new RangeError('PromiseIterator#getHandler: cannot find the handler.');
          }
        }
      }
    });

    if (typeof args[0] !== 'function') {
      this.value = [args[0]];
      this.handlers = args.slice(1);
    }

    this.init();
  }

  init() {
    let i = 0;
    let define;

    // get all named pipe function
    while (i < this.size) {
      // find first this.define(...)
      define = this.handlers[i].toString().match(reg4Define);

      // get the define name
      define = define ? define[1] : define;

      // cache the define for this.goto(name), if define name duplicate, we ignore it.
      if (typeof define === 'string' && !(define in this.namedPipeFunctions)) {
        this.namedPipeFunctions[define] = i;
      }

      i++;
    }

    // init runloop for burn down functions
    this.runloop = runloop(this);
  }

  reset() {
    this.current = 0;
    this.timestamp = null;
    this.logs = [];
  }

  next(resolve, reject) {
    const iterator = this;
    const handler = iterator.handler;

    if (typeof handler !== 'function') {
      throw new TypeError('PromiseIterator#next: handler should be a function.')
    }

    this.beforeEach();

    if (reg4notVoidFn.test(handler.toString())) {
      // generator yield will evaluate and execute the statement immediately, and then take a pause until any async process on that statement(promise) has been fulfilled. In order let the pipe run sync function, we need create a "async" here.
      // otherwise, the generator will dead in "running state" and throw an error(if we catch the exception)
      deferral(null, () => {
        handler.apply(new PipeFunction(iterator, resolve, reject), this.value);
      });
    } else {
      // void handler
      handler.apply(null, this.value);
      // resolver only accept one parameter
      resolve(this.value);
      this.afterEach();
      iterator.current++;
    }
  }

  before() {
    if (this.debug) {
      this.timestamp = Date.now();
    }

    if (typeof this._before === 'function') {
      this._before.apply(null, this.value);
    }
  }

  after() {
    if (typeof this._after === 'function') {
      this._after.apply(null, this.value);
    }

    if (this.debug) {
      this.log('Summary', '');

      this._debug(this.logs);
    }

    this.reset();
  }

  beforeEach() {
    this.log('EnterPipeFunction', `Enter PipeFunction[${this.current}]`);
    if (typeof this._beforeEach === 'function') {
      this._beforeEach.apply(null, this.value);
    }
  }

  afterEach() {
    this.log('QuitPipeFunction', `Quit PipeFunction[${this.current}]`);
    if (typeof this._afterEach === 'function') {
      this._afterEach.apply(null, this.value);
    }
  }

  start() {
    this.reset();
    this.before();
    this.runloop.next();
  }

  log(type, log) {
    if (this.debug) {
      this.logs.push({
        type: type,
        log: log,
        offset: Date.now() - this.timestamp,
        snapshot: JSON.stringify(this.value)
      });
    }
  }

  catch(e) {
    if (typeof this._reject === 'function') {
      this._reject(e, this.value);
    }
  }

  _debug(logs) {
    let report = ['\n'];

    logs.forEach((log) => {
      if (log.type === 'Summary') {
        report.push('-- Summary ----------------------------------------');
        report.push(`├ Time total(ms): ${log.offset}`);
        report.push(`└ Result snapshot: ${log.snapshot}`);
      } else {
        report.push(log.log);
        report.push(`├ Time offset(ms): ${log.offset}`);
        report.push(`└ Value snapshot: ${log.snapshot}`);
        if (log.type === 'QuitPipeFunction') {
          report.push('\n');
        }
      }
    });

    console.log(report.join('\n'));
  }
}

class PromiseIterator extends Iterator {
  constructor(...args) {
    super(...args);
  }

  promise() {
    return new Promise((resolve, reject) => {
      this.next(resolve, reject);
    });
  }

  resolve(...args) {
    this.value = args;

    if (this.current === this.size) {
      this.after();
    } else {
      this.runloop.next();
    }
  }

  reject(e) {
    this.catch(e);
  }
}

class Pipe {
  constructor(...args) {
    const iterator = new PromiseIterator(...args);
    const config = {
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
        iterator._after = fn;
        return this;
      },

      catch(fn) {
        iterator._reject = fn;
        return this;
      },

      debug(fn) {
        iterator.debug = true;
        if (typeof fn === 'function') {
          iterator._debug = fn;
        }
        return this;
      }
    };

    Object.assign(this, config);

    // invoke all pipe functions after all sync statements done
    deferral(iterator, iterator.start);
  }
}

export default function pipe(...args) {
  return new Pipe(...args);
}

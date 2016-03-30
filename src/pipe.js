export default function pipe(...args) {
  let handlers = args;
  let reg = /this\.next\(([^\)]*)\)/;
  let success = function() {
  };
  let failure = function() {
  };
  let ret;

  if (typeof args[0] !== 'function') {
    ret = [args[0]];
    handlers = args.slice(1);
  }

  let promise = function(handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('pipe: handler should be a function.')
    }
    // test if has this.next(...) should be call in a function
    if (!reg.test(handler.toString())) {
      throw new Error('this.next(...) should be called in handler.');
    }

    return new Promise(function(resolve, reject) {
      handler.apply({
        next: function(...args) {
          resolve(args);
        },
        cancel: function(reason) {
          reject({
            handler: handler,
            reason: reason
          });
        }
      }, ret);
    });
  };


  let generator = function* () {
    while (true) {
      yield promise(handlers.shift())
        .then((returns) => {
          ret = returns;
          if (handlers.length) {
            next();
          } else {
            success.apply(null, ret);
          }
        })
        .catch((reason) => failure(reason));
    }
  };

  let next = function() {
    generator().next();
  };

  class Pipe {
    constructor() {
      let timeout = window.setTimeout(function() {
        window.clearTimeout(timeout);
        next();
      }, 0);
    }

    done(fn) {
      success = fn;
      return this;
    }

    catch(fn) {
      failure = fn;
      return this;
    }
  }

  return new Pipe();
};
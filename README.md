# es6-async-pipe
Promise + Generator for async pipe.


## install and import
* `npm install es6-async-pipe --save-dev`
* `import pipe from 'es6-async-pipe';`
* you should use es6 module to import `es6-async-pipe`, you can `npm install --save-dev webpack babel-core babel-loader babel-preset-es2015 babel-preset-stage-0 babel-runtime`

#### `package.js` example:
```
{
  "name": "name",
  "version": "1.0.0",
  "description": "",
  "devDependencies": {
    "babel-core": "^6.7.4",
    "babel-loader": "^6.2.4",
    "babel-preset-es2015": "^6.6.0",
    "babel-preset-stage-0": "^6.5.0",
    "babel-runtime": "^6.6.1",
    "es6-async-pipe": "^0.1.1",
    "webpack": "^1.12.14"
  }
}
```

## How to use

### Run async functions one by one
``` javascript
function async(...args) {
  this.define('async');
  const timeout = window.setTimeout(function() {
    window.clearTimeout(timeout);
    args[0].a++;
    this.next(...args);
  }.bind(this), 1000 + Math.random() * 2000);
}

// just run async functions
pipe({ a: 0 }, async, async, async).done((...args) => {
  console.log(args);
});
```

### Run sync functions one by one
``` javascript
function sync(...args) {
  args[0].a++;
  this.next(...args);
}

// just run sync functions
pipe({ a: 0 }, sync, sync, sync).done((...args) => {
  console.log(args);
});
```

### Run async/sync functions one by one
``` javascript
// run async/sync functions
pipe({ a: 0 }, async, sync, async).done((...args) => {
  console.log(args);
});
```

### Done pipe but not wait pipe take all functions
``` javascript
function done(...args) {
  const timeout = window.setTimeout(function() {
    window.clearTimeout(timeout);
    this.done(...args);
  }.bind(this), 1000 + Math.random() * 2000);
}

// done pipe but not wait pipe take all functions
pipe({ a: 0 }, async, done, async).done((...args) => {
  console.log(args);
});
```

### Cancel pipe but not wait pipe take all functions
``` javascript
function cancel(...args) {
  const timeout = window.setTimeout(function() {
    window.clearTimeout(timeout);
    this.cancel('something happened!');
  }.bind(this), 1000 + Math.random() * 2000);
}

// cancel pipe and throw reason
pipe({ a: 0 }, async, cancel, async).catch((reason) => {
  console.log(reason.reason);
});
```

### Goto a named pipe function
``` javascript
function goto(...args) {
  const timeout = window.setTimeout(function() {
    window.clearTimeout(timeout);
    if(args[0].a < 5){
      this.goto('async', ...args);
    } else {
      this.next(...args);
    }
  }.bind(this), 1000 + Math.random() * 2000);
}

// goto a named function
pipe({ a: 0 }, async, goto, async).done((...args) => {
  console.log(args);
});
```

### Void function in pipe chain
``` javascript
// invoke void function but keep the latest function returns
pipe({ a: 0 }, async, function(...args){
  console.log(args);
  // no this.done(), this.cancel() and this.next()
  // just do nothing
}, async).done((...args) => {
  console.log(args);
});
```

## API
### pipe#debug
Enable the debug to you console
``` javascript
pipe(fn, fn, fn, ...).debug(true);
```

### pipe#done
Do something when pipe is done:
* if all functions have been done
* some function take this.done()
``` javascript
pipe(fn, fn, fn, ...).done(fn);
```

### pipe#catch
If some exceptions, then catch them
``` javascript
pipe(fn, fn, fn, ...).catch(fn);
```

### pipe#before
Before pipe start
``` javascript
pipe(fn, fn, fn, ...).before(fn);
```

### pipe#after
After pipe end
``` javascript
pipe(fn, fn, fn, ...).after(fn);
```

### pipe#beforeEach
Before each pipe function invoke
``` javascript
pipe(fn, fn, fn, ...).beforeEach(fn);
```

### pipe#afterEach
After each pipe function invoked
``` javascript
pipe(fn, fn, fn, ...).afterEach(fn);
```
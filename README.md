# es6-async-pipe
Promise + Generator for async pipe.

[![Build Status](https://travis-ci.org/Elvisz/es6-async-pipe.svg?branch=master)](https://travis-ci.org/Elvisz/es6-async-pipe)
[![browser support](https://ci.testling.com/Elvisz/es6-async-pipe.png)
](https://ci.testling.com/Elvisz/es6-async-pipe)

## Understand `es6-async-pipe`
* provide `pipe` for JavaScript but `chainable`;
* provide `goto` for JavaScript but `callback`;
* provide `Asynchronous Programming` without Generators and Promise;
* pipe functions will be run after all sync statements be done;
* allow multiple parameters to next pipe function;

## Get Start
This module export as es2015-module, you need use es6 module to import `es6-async-pipe`, you can `npm install --save-dev webpack babel-core babel-loader babel-preset-es2015 babel-preset-stage-0 babel-runtime`.

#### `package.js` example:
```
{
  ...
  "devDependencies": {
    "babel-core": "^6.7.4",
    "babel-loader": "^6.2.4",
    "babel-preset-es2015": "^6.6.0",
    "babel-preset-stage-0": "^6.5.0",
    "babel-runtime": "^6.6.1",
    "webpack": "^1.12.14",
    ...
  }
  ...
}
```

### install and import
* `npm install es6-async-pipe --save-dev`
* `import pipe from 'es6-async-pipe';`

### Create a pipe
```javascript
let pipeA = pipe(...fns);
let pipeB = pipe(data, ...fns); // create a pipe with initial data for following functions call
```

### Run async/sync functions one by one
#### `this.next(...params);`
``` javascript
function async(...args) {
  const timeout = window.setTimeout(function() {
    window.clearTimeout(timeout);
    args[0].a++;
    this.next(...args);
  }.bind(this), 1000 + Math.random() * 2000);
}

function sync(...args) {
  args[0].a++;
  this.next(...args);
}

// just run async functions
pipe({ a: 0 }, async, async, async);

// just run sync functions
pipe({ a: 0 }, sync, sync, sync);

// run async and sync functions
pipe({ a: 0 }, async, sync, async).done((...args) => {
  console.log(args);
});
```

### Done/cancel pipe but not wait pipe take all functions
#### `this.done();` and `this.cancel(reason);`
``` javascript
function done(...args) {
  const timeout = window.setTimeout(function() {
    window.clearTimeout(timeout);
    this.done();
  }.bind(this), 1000 + Math.random() * 2000);
}

function cancel(...args) {
  const timeout = window.setTimeout(function() {
    window.clearTimeout(timeout);
    this.cancel('something happened!');
  }.bind(this), 1000 + Math.random() * 2000);
}

// done pipe but not wait pipe take all functions
pipe({ a: 0 }, async, done, async/* this function won't be executed */);

// cancel pipe and throw reason
pipe({ a: 0 }, async, cancel, async/* this function won't be executed */);
```

### Goto a named pipe function
#### `this.define(name);` and `this.goto(name, ...parameters);`
``` javascript
function named(...args) {
  this.define('async');
  const timeout = window.setTimeout(function() {
    window.clearTimeout(timeout);
    args[0].a++;
    this.next(...args);
  }.bind(this), 1000 + Math.random() * 2000);
}

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
pipe({ a: 0 }, named/* this function will be call 5 times */, goto, async);
```

### Void function in pipe (NOT recommended)
``` javascript
pipe({ a: 0 }, async, function(){
  // no this.done(), this.cancel() and this.next()
  // do another things not belongs to this pipe is allowed
}, async);
```

### .apply is great
```javascript
let fns = [];
fns.push(fn);

pipe.apply(null, fns);
```


## API

### pipe#done
Do something when pipe is done:
* if all pipe functions have been done;
* some pipe function take this.done();
``` javascript
pipe(fn, fn, fn, ...).done(fn);
```

### pipe#catch
If some exceptions, then catch them.
``` javascript
pipe(fn, fn, fn, ...).catch(fn);
```

### pipe#before
Before pipe start.
``` javascript
pipe(fn, fn, fn, ...).before(fn);
```

### pipe#after
After pipe end.
``` javascript
pipe(fn, fn, fn, ...).after(fn);
```

### pipe#beforeEach
Before enter each pipe function.
``` javascript
pipe(fn, fn, fn, ...).beforeEach(fn);
```

### pipe#afterEach
After quit each pipe function.
``` javascript
pipe(fn, fn, fn, ...).afterEach(fn);
```

### pipe#debug
Enable the debug and return logs.
``` javascript
pipe(fn, fn, fn, ...).debug(function(logs){
    console.log(logs.join('\n'));
});
```
Console output:
```
Enter pipe function
├ Time offset(ms): 1
└ Value snapshot: [{"a":0}]
Exit pipe function
├ Time offset(ms): 1122
└ Value snapshot: [{"a":1}]
Enter pipe function
├ Time offset(ms): 1122
└ Value snapshot: [{"a":2}]
Exit pipe function
├ Time offset(ms): 3701
└ Value snapshot: [{"a":3}]
Enter pipe function
├ Time offset(ms): 3702
└ Value snapshot: [{"a":4}]
Exit pipe function
├ Time offset(ms): 5330
└ Value snapshot: [{"a":5}]
Async pipe completed
├ Time offset(ms): 5331
└ Value snapshot: [{"a":5}]
```

## TODO
* `pipe.add(fns)`, `pipe.remove(fn)` and `pipe.insert(fn, position)`?
* `pipe.sleep()` to resolve competition of other `setTimeout` functions?
* multiple pipe runtime support to resolve competition of other pipe?

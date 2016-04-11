'use strict';

require('babel-polyfill');

var _chai = require('chai');

var _es6AsyncPipe = require('../lib/es6-async-pipe');

var _es6AsyncPipe2 = _interopRequireDefault(_es6AsyncPipe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

describe('es6-async-pipe', function () {
  context('Pipe for sync functions', function () {
    it('sync functions should be trigger', function (done) {
      (0, _es6AsyncPipe2.default)(function () {
        done();
        this.next();
      });
    });

    it('sync should be work properly', function (done) {
      (0, _es6AsyncPipe2.default)({ a: 0 }, function (param) {
        (0, _chai.expect)(param.a).to.eq(0);
        param.a++;
        this.next(param);
      }, function (param) {
        (0, _chai.expect)(param.a).to.eq(1);
        param.a++;
        this.next(param);
      }).done(function (param) {
        (0, _chai.expect)(param.a).to.eq(2);
        done();
      });
    });
  });

  context('Pipe for async functions', function () {
    it('async functions should be trigger', function (done) {
      (0, _es6AsyncPipe2.default)(function (data) {
        setTimeout(function () {
          done();
          this.next(data);
        }.bind(this), 50);
      });
    });

    it('async should be work properly', function (done) {
      (0, _es6AsyncPipe2.default)({ a: 0 }, function (param) {
        setTimeout(function () {
          (0, _chai.expect)(param.a).to.eq(0);
          param.a++;
          this.next(param);
        }.bind(this), 30);
      }, function (param) {
        setTimeout(function () {
          (0, _chai.expect)(param.a).to.eq(1);
          done();
          this.next(param);
        }.bind(this), 30);
      });
    });
  });

  context('Pipe API', function () {
    describe('pipe#before()', function () {
      var mypipe = (0, _es6AsyncPipe2.default)({}, function () {});

      it('should have pipe#before()', function () {
        (0, _chai.expect)(mypipe).to.have.property('before');
        (0, _chai.expect)(mypipe.before).to.be.a('function');
      });

      it('pipe#before() should be triggered', function (done) {
        (0, _es6AsyncPipe2.default)(function () {}).before(function () {
          done();
        });
      });
    });

    describe('pipe#after()', function () {
      var mypipe = (0, _es6AsyncPipe2.default)({}, function () {});

      it('should have pipe#after()', function () {
        (0, _chai.expect)(mypipe).to.have.property('after');
        (0, _chai.expect)(mypipe.after).to.be.a('function');
      });

      it('pipe#after() should be triggered', function (done) {
        (0, _es6AsyncPipe2.default)(function () {}).after(function () {
          done();
        });
      });
    });

    describe('pipe#beforeEach()', function () {
      var mypipe = (0, _es6AsyncPipe2.default)({}, function () {});

      it('should have pipe#beforeEach()', function () {
        (0, _chai.expect)(mypipe).to.have.property('beforeEach');
        (0, _chai.expect)(mypipe.beforeEach).to.be.a('function');
      });

      it('pipe#beforeEach() should be triggered', function (done) {
        (0, _es6AsyncPipe2.default)(function () {}).beforeEach(function () {
          done();
        });
      });
    });

    describe('pipe#afterEach()', function () {
      var mypipe = (0, _es6AsyncPipe2.default)({}, function () {});

      it('should have pipe#afterEach()', function () {
        (0, _chai.expect)(mypipe).to.have.property('afterEach');
        (0, _chai.expect)(mypipe.afterEach).to.be.a('function');
      });

      it('pipe#afterEach() should be triggered', function (done) {
        (0, _es6AsyncPipe2.default)(function () {
          this.next();
        }).afterEach(function () {
          done();
        });
      });
    });

    describe('pipe#done()', function () {
      var mypipe = (0, _es6AsyncPipe2.default)({}, function () {});

      it('should have pipe#done()', function () {
        (0, _chai.expect)(mypipe).to.have.property('done');
        (0, _chai.expect)(mypipe.done).to.be.a('function');
      });

      it('pipe#done() should be triggered', function (done) {
        (0, _es6AsyncPipe2.default)(function () {}).done(function () {
          done();
        });
      });
    });

    describe('pipe#catch()', function () {
      var mypipe = (0, _es6AsyncPipe2.default)({}, function () {});

      it('should have pipe#catch()', function () {
        (0, _chai.expect)(mypipe).to.have.property('catch');
        (0, _chai.expect)(mypipe.catch).to.be.a('function');
      });

      it('pipe#catch() should be triggered', function (done) {
        (0, _es6AsyncPipe2.default)(function () {
          this.cancel();
        }).catch(function () {
          done();
        });
      });

      it('it should be functions', function () {
        (0, _es6AsyncPipe2.default)('', '').catch(function (e) {
          (0, _chai.expect)(e).to.eq('TypeError: PromiseIterator#next: handler should be a function.');
        });
      });
    });

    describe('pipe#debug()', function () {
      var mypipe = (0, _es6AsyncPipe2.default)({}, function () {});

      it('should have pipe#debug()', function () {
        (0, _chai.expect)(mypipe).to.have.property('debug');
        (0, _chai.expect)(mypipe.debug).to.be.a('function');
      });

      it('pipe#debug() should be triggered', function (done) {
        (0, _es6AsyncPipe2.default)(function () {
          this.next();
        }).debug();

        (0, _es6AsyncPipe2.default)(function () {
          this.next();
        }).debug(function () {
          done();
        });
      });
    });
  });

  context('PipeFunction API', function () {
    var control = void 0;

    (0, _es6AsyncPipe2.default)(function () {
      control = this;
      this.done();
    });

    describe('this#define()', function () {
      it('should have this#define()', function () {
        (0, _chai.expect)(control).to.have.property('define');
        (0, _chai.expect)(control.define).to.be.a('function');
      });
    });

    describe('this#next()', function () {
      it('should have this#next()', function () {
        (0, _chai.expect)(control).to.have.property('next');
        (0, _chai.expect)(control.next).to.be.a('function');
      });

      it('this#next() should work properly', function (done) {
        (0, _es6AsyncPipe2.default)(function () {
          this.next('next');
        }, function (param) {
          (0, _chai.expect)(param).to.eq('next');
          done();
        });
      });
    });

    describe('this#done()', function () {
      it('should have this#done()', function () {
        (0, _chai.expect)(control).to.have.property('done');
        (0, _chai.expect)(control.done).to.be.a('function');
      });

      it('this#done() should work properly', function (done) {
        (0, _es6AsyncPipe2.default)(function () {
          this.next('done');
        }, function () {
          this.done();
        }).done(function (param) {
          (0, _chai.expect)(param).to.eq('done');
          done();
        });
      });
    });

    describe('this#cancel()', function () {
      it('should have this#cancel()', function () {
        (0, _chai.expect)(control).to.have.property('cancel');
        (0, _chai.expect)(control.cancel).to.be.a('function');
      });

      it('this#cancel() should work properly', function (done) {
        (0, _es6AsyncPipe2.default)(function () {
          this.next('done');
        }, function () {
          this.cancel('error');
        }).catch(function (e) {
          (0, _chai.expect)(e).to.eq('error');
          done();
        });
      });
    });

    describe('this#goto()', function () {
      it('should have this#goto()', function () {
        (0, _chai.expect)(control).to.have.property('goto');
        (0, _chai.expect)(control.goto).to.be.a('function');
      });

      it('this#goto(define): define should be a string', function () {
        (0, _es6AsyncPipe2.default)(function (param) {
          this.define('first');
          this.next('done');
        }, function (param) {
          try {
            this.goto();
          } catch (e) {
            (0, _chai.expect)(e.toString()).to.eq('TypeError: pipe#goto(define, ...args): define should be a string.');
          }
        });
      });

      it('this#goto() should work properly', function (done) {
        (0, _es6AsyncPipe2.default)(function (param) {
          this.define('first');
          if (!!param) {
            (0, _chai.expect)(param).to.eq('data from goto');
            done();
            this.done();
          }
          this.next('done');
        }, function (param) {
          (0, _chai.expect)(param).to.eq('done');
          this.goto('first', 'data from goto');
        });
      });
    });
  });
});
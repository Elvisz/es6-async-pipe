import 'babel-polyfill';
import {
  expect
} from 'chai';
import pipe from '../lib/es6-async-pipe';

describe('es6-async-pipe', function() {
  context('API', function() {
    describe('pipe#before()', function() {
      let mypipe = pipe({}, function() {});

      it('should have pipe#before()', function() {
        expect(mypipe).to.have.property('before');
        expect(mypipe.before).to.be.a('function');
      });

      it('pipe#before() should be triggered', function(done) {
        pipe(function() {}).before(function() {
          done();
        });
      });
    });

    describe('pipe#after()', function() {
      let mypipe = pipe({}, function() {});

      it('should have pipe#after()', function() {
        expect(mypipe).to.have.property('after');
        expect(mypipe.after).to.be.a('function');
      });

      it('pipe#after() should be triggered', function(done) {
        pipe(function() {}).after(function() {
          done();
        });
      });
    });

    describe('pipe#beforeEach()', function() {
      let mypipe = pipe({}, function() {});

      it('should have pipe#beforeEach()', function() {
        expect(mypipe).to.have.property('beforeEach');
        expect(mypipe.beforeEach).to.be.a('function');
      });

      it('pipe#beforeEach() should be triggered', function(done) {
        pipe(function() {}).beforeEach(function() {
          done();
        });
      });
    });

    describe('pipe#afterEach()', function() {
      let mypipe = pipe({}, function() {});

      it('should have pipe#afterEach()', function() {
        expect(mypipe).to.have.property('afterEach');
        expect(mypipe.afterEach).to.be.a('function');
      });

      it('pipe#afterEach() should be triggered', function(done) {
        pipe(function() {
          this.next();
        }).afterEach(function() {
          done();
        });
      });
    });

    describe('pipe#done()', function() {
      let mypipe = pipe({}, function() {});

      it('should have pipe#done()', function() {
        expect(mypipe).to.have.property('done');
        expect(mypipe.done).to.be.a('function');
      });

      it('pipe#done() should be triggered', function(done) {
        pipe(function() {}).done(function() {
          done();
        });
      });
    });

    describe('pipe#catch()', function() {
      let mypipe = pipe({}, function() {});

      it('should have pipe#catch()', function() {
        expect(mypipe).to.have.property('catch');
        expect(mypipe.catch).to.be.a('function');
      });

      it('pipe#catch() should be triggered', function(done) {
        pipe(function() {
          this.cancel();
        }).catch(function() {
          done();
        });
      });
    });
  });

  context('Pipe Control', function() {
    let control;

    pipe(function() {
      control = this;
      this.done();
    });

    it('should have this#next()', function() {
      expect(control).to.have.property('next');
      expect(control.next).to.be.a('function');
    });

    it('should have this#done()', function() {
      expect(control).to.have.property('done');
      expect(control.done).to.be.a('function');
    });

    it('should have this#define()', function() {
      expect(control).to.have.property('define');
      expect(control.define).to.be.a('function');
    });

    it('should have this#cancel()', function() {
      expect(control).to.have.property('cancel');
      expect(control.cancel).to.be.a('function');
    });
  });

  context('Pipe sync', function() {
    it('sync functions should be trigger', function(done) {
      pipe(function() {
        done();
        this.next();
      });
    });

    it('sync should be work properly', function(done) {
      pipe({a: 0}, function(param) {
        expect(param.a).to.eq(0);
        param.a++;
        this.next(param);
      }, function(param) {
        expect(param.a).to.eq(1);
        param.a++;
        this.next(param);
      }).done(function(param){
        expect(param.a).to.eq(2);
        done();
      });
    });
  });

  context('Pipe Async', function() {
    it('async functions should be trigger', function(done) {
      pipe(function(data) {
        setTimeout(function() {
          done();
          this.next(data);
        }.bind(this), 50);
      });
    });

    it('async should be work properly', function(done) {
      pipe({a: 0}, function(param) {
        setTimeout(function() {
          expect(param.a).to.eq(0);
          param.a++;
          this.next(param);
        }.bind(this), 30);
      }, function(param) {
        setTimeout(function() {
          expect(param.a).to.eq(1);
          done();
          this.next(param);
        }.bind(this), 30);
      });
    });
  });
});
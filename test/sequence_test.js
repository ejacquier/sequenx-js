var companion = require('companion');
var sinon = require('sinon');
var expect = require("chai").expect;
var assert = require("chai").assert;
var Sequenx = require('../js/sequenx.node.js');

// Mock
var customLog = {
    getChild: () => { },
    info: () => { },
    warning: () => { },
    error: () => { },
    name: "",
    dispose: () => { }
}

function delayDispose(lapse, delay, action) {
    if (delay === undefined)
        delay = 50;
    var disposable = lapse.sustain();
    setTimeout(() => {
        action && action();
        disposable.dispose();
    }, delay);
}

// Test
describe("Lapse", function() {

    before(function() {
        Sequenx.Log.isEnabled = false;
    })

    it("should be able to create a Sequence instance with name and start", function() {
        var seq = new Sequenx.Sequence("seq");
        seq.start();
        expect(seq).instanceof(Sequenx.Sequence);
    });

    it("should be able to create a Sequence instance no name and start", function() {
        var seq = new Sequenx.Sequence();
        seq.start();
        expect(seq).instanceof(Sequenx.Sequence);
    });

    it("should be able to create a Sequence instance with custom log and start", function() {
        var seq = new Sequenx.Sequence(customLog);
        seq.start();
        expect(seq).instanceof(Sequenx.Sequence);
    });


    it("should be able to start a sequence with 1 action", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = sinon.spy(lapse => { });
        seq.do(spy);
        seq.onCompleted(() => {
            expect(spy.calledOnce, "action not executed").to.be.true
            done();
        });
        seq.start();
    });

    it("should not be able to run sequence twice", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = sinon.spy(lapse => { });
        seq.do(spy);
        seq.onCompleted(() => {
            expect(spy.calledOnce, "action not executed").to.be.true
            done();
        });
        seq.start();
        seq.start();
    });

    it("should be able to start a sequence with 1 action and wait complete", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = sinon.spy(lapse => delayDispose(lapse));
        seq.do(spy);
        seq.onCompleted(() => {
            expect(spy.calledOnce, "action not executed").to.be.true
            done();
        });
        seq.start();
    });

    it("should be able to start a sequence with 1 fail action", function() {
        var seq = new Sequenx.Sequence(customLog);
        seq.do(l => { throw "error"; });

        try {
            seq.start();
            throw "test fail";
        }
        catch (e) {
            expect(e).to.equal("error");
        }
    });


    it("should don't call complete since all lapse was complete", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        seq.do(lapse => lapse.sustain());
        seq.onCompleted(() => {
            assert.fail(null, null, "complete should not be call");
        });
        seq.start();
        setTimeout(done, 500);
    });

    it("should be able to start a sequence with 2 action in order", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.do(lapse => {
            spy += "A";
            delayDispose(lapse);
        });
        seq.do(lapse => {
            spy += "B";
            delayDispose(lapse);
        });
        seq.onCompleted(() => {
            expect(spy.length, "action not executed").to.equal(2);
            expect(spy, "action not executed in order").to.equal("AB");
            done();
        });
        seq.start();
    });

    it("should be able to start a sequence async", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.do(lapse => {
            spy += "A";
            delayDispose(lapse);
        });
        seq.do(lapse => {
            spy += "C";
            delayDispose(lapse);
        });
        seq.onCompleted(() => {
            expect(spy, "action was not async").not.to.equal("ACB");
            expect(spy, "action not executed in order").to.equal("ABC");
            done();
        });
        seq.start();
        spy += "B";
    });


    it("should be able skip action and go to end (skipToEnd)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.do(lapse => {
            spy += "A";
            delayDispose(lapse);
            seq.skipToEnd(); //skip other action;
        });
        seq.do(lapse => {
            spy += "B";
            delayDispose(lapse);
        });
        seq.onCompleted(() => {
            expect(spy, "action not skip").to.equal("A");
            done();
        });
        seq.start();
    });

    it("should be able to create and skip to the mark (doMark, skipToMarker)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        var mark = {};
        seq.do(lapse => {
            spy += "A";
            delayDispose(lapse);
        });
        seq.do(lapse => {
            spy += "B";
            delayDispose(lapse);
        });
        seq.doMark(mark);
        seq.do(lapse => {
            spy += "C";
            delayDispose(lapse);
        });
        seq.onCompleted(() => {
            expect(spy, "action not skip").to.equal("AC");
            done();
        });
        seq.start();
        seq.skipToMarker(mark);
    });


    it("should be able to add delay between action (doWait)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.do(lapse => {
            spy += "A";
        });
        seq.doWait(100);
        seq.do(lapse => {
            spy += "C";
        });
        seq.onCompleted(() => {
            expect(spy, "action was not async").not.to.equal("ACB");
            expect(spy, "action not executed in order").to.equal("ABC");
            done();
        });
        seq.start();
        spy += "B";
    });

    it("should be able to wait to dispose a object (doWaitForDispose)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.do(lapse => {
            spy += "A";
        });
        var disposable = seq.doWaitForDispose();
        seq.do(lapse => {
            spy += "C";
        });
        seq.onCompleted(() => {
            expect(spy, "action was not async").not.to.equal("ACB");
            expect(spy, "action not executed in order").to.equal("ABC");
            done();
        });
        seq.start();
        spy += "B";
        disposable.dispose();
    });

    it("should be able to add a simple dispose action (doParallel)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.doParallel(parallel => {
            parallel.do(l => delayDispose(l, 50, () => spy += "A"));
            parallel.do(l => delayDispose(l, 150, () => spy += "C"));
            parallel.do(l => delayDispose(l, 100, () => spy += "B"));
        })
        seq.onCompleted(() => {
            expect(spy, "seq is not parallel").to.equal("ABC");
            done();
        });
        seq.start();
    });


    it("should be able to add a simple dispose action (doDispose)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";

        var obj = {
            dispose: () => { }
        }
        var spy = sinon.spy(obj, "dispose");

        seq.doDispose(obj);

        seq.onCompleted(() => {
            expect(obj.dispose.calledOnce).to.be.true;
            done();
        });
        seq.start();
    });


    it("should be able to create a sub Sequence (doSequence)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.doSequence(seq2 => {
            seq2.do(l => delayDispose(l, 50, () => spy += "A"));
            seq2.do(l => delayDispose(l, 150, () => spy += "C"));
            seq2.do(l => delayDispose(l, 100, () => spy += "B"));
        })
        seq.onCompleted(() => {
            expect(spy, "seq is not parallel").to.equal("ACB");
            done();
        });
        seq.start();
    });

    it("should be able dispose sequence and skipt action (dispose)", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        var spy = "";
        seq.do(lapse => {
            spy += "A";
            delayDispose(lapse);
            seq.dispose(); //skip other action;
        });
        seq.do(lapse => {
            spy += "B";
            delayDispose(lapse);
        });
        seq.onCompleted(() => {
            expect(spy, "action not skip").to.equal("A");
            done();
        });
        seq.start();
    });

    it("should be able to retrieve log name", function() {
        var seq = new Sequenx.Sequence("seq");
        expect(seq.name).to.equal("seq");
    });

    it("should be log error if try add other then Sequenx.Item", function() {
        var seq = new Sequenx.Sequence(customLog);
        sinon.spy(customLog, "error");
        seq.add("error");
        expect(customLog.error.calledOnce).to.be.true;
        expect(customLog.error.getCall(0).args[0]).to.be.equal("Trying to add something other than Sequenx.Item, use do if you use a function(lapse)");
        customLog.error.restore();
    });

    it("should be ignore sequence with no action", function(done) {
        var seq = new Sequenx.Sequence(customLog);
        sinon.spy(customLog, "info");
        var item = new Sequenx.Item(null, "empty");
        item.action = null;
        seq.add(item);
        seq.onCompleted(() => {
            expect(customLog.info.getCall(0).args[0]).to.be.equal("Message: empty");
            done();
        });
        seq.start();
        customLog.info.restore();
    });
});
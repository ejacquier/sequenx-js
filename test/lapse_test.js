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


// Test
describe("Lapse", function() {

    before(function() {
        Sequenx.Log.isEnabled = false;
    })

    it("should be able to create a lapse instance", function() {
        var lapse = new Sequenx.Lapse("lapse");
        expect(lapse).instanceof(Sequenx.Lapse);
    });

    it("should be able to create with custom log", function() {
        var log = new Sequenx.Log();
        var lapse = new Sequenx.Lapse(customLog);
        expect(lapse).instanceof(Sequenx.Lapse);
    });

    it("should be able start empty lapse", function() {
        var log = new Sequenx.Log();
        var lapse = new Sequenx.Lapse(customLog);
        lapse.start();
    });

    it("should be able to dispose Lapse and receive complete", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        lapse.onCompleted(done);
        lapse.dispose();
    });

    it("should be able to sustain Lapse and dispose it after start", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        var subLapse = lapse.sustain("sub lapse");
        lapse.onCompleted(done);
        lapse.start();
        subLapse.dispose();
    });

    it("should not complete if never start", function() {
        var lapse = new Sequenx.Lapse(customLog);
        var subLapse = lapse.sustain("sub lapse");
        lapse.onCompleted(() => assert.fail("should be never call complete"));
        subLapse.dispose();
    });

    it("should be able to pass empty name to sustain", function() {
        var lapse = new Sequenx.Lapse(customLog);
        var subLapse = lapse.sustain();
    });

    it("should be able to sustain Lapse and dispose it before start", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        var subLapse = lapse.sustain("sub lapse");
        lapse.onCompleted(done);
        subLapse.dispose();
        lapse.start();
    });

    it("should be able to sustain Lapse without log name", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        var subLapse = lapse.sustain();
        lapse.onCompleted(done);
        subLapse.dispose();
        lapse.start();
    });

    it("should be able to sustain Lapse 2 time and receive complete after dispose 2 lapse", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        var subLapse = lapse.sustain("sub lapse");
        var sub2Lapse = lapse.sustain("sub2 lapse");
        var lasDisposed;
        lapse.onCompleted(function() {
            expect(lasDisposed).to.equal(true);
            done();
        });

        lapse.start();
        subLapse.dispose();
        lasDisposed = true;
        sub2Lapse.dispose();
    });

    it("should be able to create a sequence from lapse", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        lapse.sequence(seq => {
            expect(seq).instanceof(Sequenx.Sequence);
            done();
        });
        lapse.start();
    });

    it("should be able to create a sequence from lapse and wait sequence complete", function(done) {
        var lapse = new Sequenx.Lapse(customLog);
        var spy="";
        lapse.sequence(seq => {
            expect(seq).instanceof(Sequenx.Sequence);
            seq.do(l => {
                var d = l.sustain();
                spy+="A";
                setTimeout(() => d.dispose(), 50);
            });
        });
         lapse.onCompleted(function() {
            expect(spy).to.equal("AB");
            done();
        });
        lapse.start();
        spy+="B";
    });

    it("should be able to retrieve log name", function() {
        var lapse = new Sequenx.Lapse("lapse");
        expect(lapse.name).to.equal("lapse");
    });

    it("should be able log Lapse on substain", function() {
        Sequenx.Log.isEnabled = true;
        sinon.spy(customLog, "info");

        var clog = console.log;
        console.log = () => { }
        var log = new Sequenx.Log();
        var lapse = new Sequenx.Lapse(customLog);
        lapse.sustain("sustain");
        lapse.dispose();
        lapse.start();
        console.log = clog;

        expect(customLog.info.callCount, "info not called").to.equal(2)
        expect(customLog.info.getCall(0).args[0]).to.be.equal("Sustain sustain");
        expect(customLog.info.getCall(1).args[0]).to.be.equal("Cancelling");
        customLog.info = () => { };
    });
});
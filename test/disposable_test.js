var companion = require('companion');
var sinon = require('sinon');
var expect = require("chai").expect;
var assert = require("chai").assert;
var Sequenx = require('../js/sequenx.node.js');


// Test
describe("Disposable", function() {
    describe("RefCountDisposable", function() {
        it("should be able to dispose RefCountDisposable", function(done) {
            var refcount = new Sequenx.RefCountDisposable(Sequenx.Disposable.create(done));
            refcount.dispose();
        })

        it("should be not dispose since all ref was disposed", function(done) {
            var count = 0;
            var refcount = new Sequenx.RefCountDisposable(Sequenx.Disposable.create(() => {
                expect(count).to.equal(3);
                done();
            }));
            count++;
            var d = refcount.getDisposable();
            count++;
            refcount.getDisposable().dispose();
            count++;
            refcount.dispose();
            d.dispose();
        });
    });
});
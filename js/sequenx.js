var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Sequenx;
(function (Sequenx) {
    var Lapse = (function () {
        function Lapse(name) {
            var _this = this;
            this._completedSubject = new Rx.Subject();
            this._started = false;
            this.name = name;
            if (name == "empty") {
                return;
            }
            this.id = Lapse.nextId++;
            console.log("Lapse " + this.name + " (" + this.id + ") STARTED");
            this._refCountDisposable = new Rx.RefCountDisposable(Rx.Disposable.create(function () {
                console.log("Lapse " + _this.name + " (" + _this.id + ") COMPLETED");
                _this._completedSubject.onCompleted();
                _this._disposables = null;
                _this.dispose();
            }));
            if (this._disposables == null) {
                this._disposables = new Rx.CompositeDisposable();
            }
        }
        Object.defineProperty(Lapse.prototype, "completed", {
            get: function () {
                return this._completedSubject;
            },
            enumerable: true,
            configurable: true
        });
        Lapse.prototype.extend = function (description, timer) {
            var _this = this;
            console.log("Lapse " + this.name + " (" + this.id + ") EXTENDED +++++ " + description);
            if (this._refCountDisposable != null) {
                if (this._refCountDisposable.isDisposed)
                    console.error("Extending disposed lapse: " + this.name + " (" + this.id + ")");
                var disposable_1 = this._refCountDisposable.getDisposable();
                var reference = Rx.Disposable.create(function () {
                    console.log("Lapse " + _this.name + " (" + _this.id + ") RELEASED ----- " + description);
                    _this._completedSubject.onNext(description);
                    disposable_1.dispose();
                });
                this._disposables.add(reference);
                return reference;
            }
            return Rx.Disposable.empty;
        };
        Lapse.prototype.start = function () {
            this._started = true;
            this._refCountDisposable.dispose();
        };
        Lapse.prototype.dispose = function () {
            if (!this._started) {
                console.error("Trying to dipose a Lapse not yet started!");
                return;
            }
            if (this._disposables != null) {
                console.warn("Lapse " + this.name + " (" + this.id + ") INTERRUPTED ----- ");
                this._disposables.dispose();
            }
            this._disposables = null;
            this._refCountDisposable = null;
            this._completedSubject.dispose();
        };
        Lapse.Empty = new Lapse("empty");
        Lapse.nextId = 0;
        return Lapse;
    }());
    Sequenx.Lapse = Lapse;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Sequence = (function () {
        function Sequence(name, lapse) {
            this._completedSubject = new Rx.Subject();
            this.name = name;
            this._lapse = lapse;
            this._items = new Array();
            console.log('Create sequence ' + name);
        }
        Object.defineProperty(Sequence.prototype, "completed", {
            get: function () {
                return this._completedSubject;
            },
            enumerable: true,
            configurable: true
        });
        Sequence.prototype.add = function (action, lapseDescription, timer) {
            this._items.push(new SequenceItem(action, lapseDescription, timer));
        };
        Sequence.prototype.addParallel = function (action, name) {
            var lapse = new Sequenx.Lapse("parallel:" + name);
            var parallel = new Sequenx.Parallel(name, lapse);
            action(parallel);
            var sequenceItem = new SequenceItem(null, lapse.name, null);
            sequenceItem.parallel = parallel;
            this._items.push(sequenceItem);
        };
        Sequence.prototype.start = function () {
            console.log("Starting sequence " + this.name);
            if (this._items.length > 0)
                this.doItem(this._items.shift());
            else
                this.onSequenceComplete();
        };
        Sequence.prototype.doItem = function (item) {
            var _this = this;
            console.log("Sequence doItem " + item.toString());
            var lapse;
            if (this instanceof Sequenx.Parallel) {
                lapse = this._lapse;
                lapse.completed.subscribe(function (nextItem) {
                    _this._completedSubject.onNext(nextItem);
                }, null, function () {
                    _this.onSequenceComplete();
                });
                item.action(lapse);
                for (var i = 0; i < this._items.length; i++) {
                    this._items[i].action(lapse);
                }
                lapse.start();
            }
            else if (item.parallel != null) {
                item.parallel.completed.subscribe(function () { }, null, function () {
                    _this._completedSubject.onNext(item.lapseDescription);
                    if (_this._items.length > 0)
                        _this.doItem(_this._items.shift());
                    else
                        _this.onSequenceComplete();
                });
                item.parallel.start();
                item.parallel._lapse.start();
            }
            else {
                lapse = new Sequenx.Lapse(item.lapseDescription);
                lapse.completed.subscribe(function () { }, null, function () {
                    _this._completedSubject.onNext(item.lapseDescription);
                    if (_this._items.length > 0)
                        _this.doItem(_this._items.shift());
                    else
                        _this.onSequenceComplete();
                });
                item.action(lapse);
                lapse.start();
            }
        };
        Sequence.prototype.onSequenceComplete = function () {
            this._completedSubject.onCompleted();
        };
        Sequence.prototype.dispose = function () {
        };
        return Sequence;
    }());
    Sequenx.Sequence = Sequence;
    var SequenceItem = (function () {
        function SequenceItem(action, lapseDescription, timer) {
            this.timer = null;
            this.parallel = null;
            this.action = action;
            this.lapseDescription = lapseDescription;
            this.timer = timer;
        }
        SequenceItem.prototype.toString = function () {
            return this.lapseDescription;
        };
        return SequenceItem;
    }());
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Parallel = (function (_super) {
        __extends(Parallel, _super);
        function Parallel() {
            _super.apply(this, arguments);
        }
        return Parallel;
    }(Sequenx.Sequence));
    Sequenx.Parallel = Parallel;
})(Sequenx || (Sequenx = {}));
//# sourceMappingURL=sequenx.js.map
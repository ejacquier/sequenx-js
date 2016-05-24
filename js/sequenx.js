var Sequenx;
(function (Sequenx) {
    var Log = (function () {
        function Log(name, parent) {
            this._parent = parent;
            this._name = name != null ? name : "";
            this._id = Log.s_nextId++;
            if (Log.isEnabled)
                console.log(this.fullName + Log.StartSuffix);
        }
        Log.prototype.toString = function () {
            return this.fullName;
        };
        Log.prototype.dispose = function () {
            if (this._isDisposed)
                return;
            if (Log.isEnabled)
                console.log(this.fullName + Log.EndSuffix);
            this._isDisposed = true;
        };
        Log.prototype.getChild = function (name) {
            return new Log(name, this);
        };
        Log.prototype.info = function (message) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            if (Log.isEnabled)
                console.log(this.format(message, params));
        };
        Log.prototype.warning = function (message) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            console.warn(this.format(message, params));
        };
        Log.prototype.error = function (message) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            console.error(this.format(message, params));
        };
        Object.defineProperty(Log.prototype, "fullName", {
            get: function () {
                if (this._fullName == null) {
                    if (this._parent != null)
                        this._fullName = this._parent.fullName + Log.PathSeparator + this.getNameWithId();
                    else
                        this._fullName = this.getNameWithId();
                }
                return this._fullName;
            },
            enumerable: true,
            configurable: true
        });
        Log.prototype.getNameWithId = function () {
            return "(" + this._id + ") " + this._name;
        };
        Log.prototype.format = function (message) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            if (params != null && params.length > 0)
                message = this.strFormat(message, params);
            return this.fullName + Log.MessageSeparator + message;
        };
        Log.prototype.strFormat = function (str) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            var args = params;
            return str.replace(/{(\d+)}/g, function (match, number) {
                return typeof args[number] != 'undefined' ? args[number] : match;
            });
        };
        Log.PathSeparator = "     ";
        Log.MessageSeparator = "     ";
        Log.StartSuffix = " [START]";
        Log.EndSuffix = " [END]";
        Log.s_nextId = 1;
        Log.isEnabled = true;
        return Log;
    })();
    Sequenx.Log = Log;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Lapse = (function () {
        function Lapse(name) {
            var _this = this;
            this._completedSubject = new Rx.Subject();
            this._log = new Sequenx.Log(name);
            this._refCountDisposable = new Rx.RefCountDisposable(Rx.Disposable.create(function () { return _this.onCompleted(); }));
        }
        Object.defineProperty(Lapse.prototype, "completed", {
            get: function () {
                return this._completedSubject;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Lapse.prototype.sustain = function () {
            if (this._isCompleted || this._isDisposed)
                return Rx.Disposable.empty;
            return this._refCountDisposable.getDisposable();
        };
        Lapse.prototype.start = function () {
            if (this._isStarted || this._isCompleted || this._isDisposed)
                return;
            this._isStarted = true;
            this._refCountDisposable.dispose();
        };
        Lapse.prototype.dispose = function () {
            if (this._isDisposed)
                return;
            if (!this._isCompleted) {
                this._log.info("Cancelling");
            }
            this.onCompleted();
        };
        Lapse.prototype.onCompleted = function () {
            if (this._isCompleted)
                return;
            this._isCompleted = true;
            this._isDisposed = true;
            this._log.dispose();
            this._completedSubject.onCompleted();
        };
        return Lapse;
    })();
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
            this._disposable = this._lapse.sustain();
            console.log('Create sequence ' + name);
        }
        Object.defineProperty(Sequence.prototype, "completed", {
            get: function () {
                return this._completedSubject;
            },
            set: function (value) {
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
            var sequenceItem = new SequenceItem(null, "", null);
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
            this._disposable.dispose();
        };
        Sequence.prototype.dispose = function () {
        };
        return Sequence;
    })();
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
    })();
})(Sequenx || (Sequenx = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Sequenx;
(function (Sequenx) {
    var Parallel = (function (_super) {
        __extends(Parallel, _super);
        function Parallel() {
            _super.apply(this, arguments);
        }
        return Parallel;
    })(Sequenx.Sequence);
    Sequenx.Parallel = Parallel;
})(Sequenx || (Sequenx = {}));

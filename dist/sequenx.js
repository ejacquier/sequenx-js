var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var Sequenx;
(function (Sequenx) {
    var CallbackItem = (function () {
        function CallbackItem(action, message) {
            this.action = action;
            this.message = message;
        }
        CallbackItem.prototype.start = function (cb) {
            if (this.action.length > 0)
                this.action(cb);
            else {
                this.action();
                cb();
            }
        };
        CallbackItem.prototype.toString = function () {
            return "[Item] msg %s action %s", this.message, (this.action != null).toString();
        };
        return CallbackItem;
    }());
    Sequenx.CallbackItem = CallbackItem;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var MarkItem = (function () {
        function MarkItem(marker, message) {
            this.marker = marker;
            this.message = message;
        }
        MarkItem.prototype.start = function (cb) {
            cb();
        };
        MarkItem.prototype.toString = function () {
            return "[Item] msg %s mark %s", this.message, this.marker;
        };
        return MarkItem;
    }());
    Sequenx.MarkItem = MarkItem;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Sequence = (function () {
        function Sequence(nameOrLog) {
            this._pendingExecution = Sequenx.Disposable.empty;
            this._items = new Array();
            this._isStarted = false;
            this._isDisposed = false;
            this._isCompleted = false;
            this._isExecuting = false;
            if (!nameOrLog)
                this._log = new Sequenx.Log("");
            else if (typeof nameOrLog === "string")
                this._log = new Sequenx.Log(nameOrLog);
            else
                this._log = nameOrLog;
        }
        Object.defineProperty(Sequence.prototype, "name", {
            get: function () {
                return this._log.name;
            },
            enumerable: true,
            configurable: true
        });
        Sequence.prototype.getChildLog = function (name) {
            return this._log.getChild(name);
        };
        Sequence.prototype.add = function (item) {
            if (!item.start) {
                this._log.error("Trying to add something other than Sequenx.Item, use do if you use a function(lapse)");
                return;
            }
            if (this._isDisposed)
                throw new Error("Trying to add action to a disposed sequence.");
            this._items.push(item);
        };
        Sequence.prototype.start = function (cb) {
            if (this._isStarted || this._isDisposed)
                return;
            this._isStarted = true;
            this._cbComplete = cb;
            this.scheduleNext();
        };
        Sequence.prototype.scheduleNext = function () {
            this._pendingExecution.dispose();
            this.executeNext();
        };
        Sequence.prototype.executeNext = function () {
            var _this = this;
            if (this._isExecuting || this._isCompleted || this._isDisposed)
                return;
            if (this._items.length === 0) {
                this.onLastItemCompleted();
                return;
            }
            var item = this._items.shift();
            try {
                this._isExecuting = true;
                item.start(function () {
                    _this._isExecuting = false;
                    _this.scheduleNext();
                });
            }
            catch (error) {
                this._isExecuting = false;
                throw error;
            }
        };
        Sequence.prototype.onLastItemCompleted = function () {
            this.onSequenceComplete();
        };
        Sequence.prototype.dispose = function () {
            if (this._isDisposed)
                return;
            if (!this._isCompleted)
                this._log.warning("Cancelling (" + this._items.length + " items)");
            this.onSequenceComplete();
        };
        Sequence.prototype.onSequenceComplete = function () {
            if (this._isCompleted)
                return;
            this._items.length = 0;
            this._isCompleted = true;
            this._isDisposed = true;
            this._log.dispose();
            this._cbComplete && this._cbComplete();
        };
        Sequence.prototype.doDispose = function (disposable, message) {
            this.do(function () { return disposable.dispose(); }, message ? message : "Dispose");
            return this;
        };
        Sequence.prototype.do = function (action, message) {
            this.add(new Sequenx.CallbackItem(action, message));
            return this;
        };
        Sequence.prototype.doWait = function (duration, message) {
            this.do(function (done) { return setTimeout(done, duration); }, message ? message : "Wait " + (duration / 1000) + "s");
            return this;
        };
        Sequence.prototype.doWaitForDispose = function (duration, message) {
            var disposable = new Sequenx.Disposable();
            this.do(function (done) { disposable.action = done; }, message ? message : "WaitForDispose");
            return disposable;
        };
        Sequence.prototype.doMark = function (marker) {
            this.add(new Sequenx.MarkItem(marker));
            return this;
        };
        Sequence.prototype.doParallel = function (action, message) {
            var parallel = new Sequenx.Parallel();
            parallel.message = message ? message : "Parallel";
            action(parallel);
            this.add(parallel);
            return this;
        };
        Sequence.prototype.doSequence = function (action, message) {
            message = message ? message : "Sequence";
            var sequence = new Sequence();
            action(sequence);
            this.add(sequence);
            return this;
        };
        Sequence.prototype.skipToMarker = function (marker, cancelCurrent) {
            if (cancelCurrent === void 0) { cancelCurrent = false; }
            this.skipTo(function (x) { return x instanceof Sequenx.MarkItem && x.marker === marker; });
        };
        Sequence.prototype.skipToEnd = function () {
            this.skip(function (x) { return true; });
        };
        Sequence.prototype.skip = function (predicate) {
            while (this._items.length > 0 && predicate(this._items[0]))
                this._items.splice(0, 1);
        };
        Sequence.prototype.skipTo = function (predicate) {
            var index = -1;
            for (var i = 0; i < this._items.length; i++) {
                if (predicate(this._items[i])) {
                    index = i;
                    break;
                }
            }
            if (index !== -1) {
                this._items = this._items.slice(index);
            }
        };
        return Sequence;
    }());
    Sequenx.Sequence = Sequence;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Parallel = (function (_super) {
        __extends(Parallel, _super);
        function Parallel() {
            _super.call(this);
        }
        Parallel.prototype.scheduleNext = function () {
            var _this = this;
            var count = this._items.length;
            if (!count)
                return this._cbComplete && this._cbComplete();
            this._items.forEach(function (item) { return item
                .start(function () { return --count <= 0 && _this._cbComplete && _this._cbComplete(); }); });
            this._items = [];
        };
        Parallel.prototype.skip = function (predicate) {
            throw new Error("skip not implemented for Parallel");
        };
        Parallel.prototype.skipTo = function (predicate) {
            throw new Error("skipTo not implemented for Parallel");
        };
        return Parallel;
    }(Sequenx.Sequence));
    Sequenx.Parallel = Parallel;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Disposable = (function () {
        function Disposable(action) {
            this.action = action;
            this._isDisposed = false;
        }
        Disposable.create = function (action) {
            return new Disposable(action);
        };
        Object.defineProperty(Disposable.prototype, "isDisposed", {
            get: function () {
                return this._isDisposed;
            },
            enumerable: true,
            configurable: true
        });
        Disposable.prototype.dispose = function () {
            !this._isDisposed && this.action && this.action();
            this._isDisposed = true;
        };
        Disposable.empty = new Disposable();
        return Disposable;
    }());
    Sequenx.Disposable = Disposable;
    var RefCountDisposable = (function (_super) {
        __extends(RefCountDisposable, _super);
        function RefCountDisposable(disposable) {
            var _this = this;
            _super.call(this, function () { return _this._self.dispose(); });
            this.disposable = disposable;
            this._count = 0;
            this._self = this.getDisposable();
        }
        RefCountDisposable.prototype.getDisposable = function () {
            var _this = this;
            this._count++;
            return this.isDisposed ? Disposable.empty : Disposable.create(function () {
                _this._count--;
                if (_this._count <= 0)
                    _this.disposable.dispose();
            });
        };
        return RefCountDisposable;
    }(Disposable));
    Sequenx.RefCountDisposable = RefCountDisposable;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Lapse = (function () {
        function Lapse(nameOrLog) {
            var _this = this;
            if (!nameOrLog)
                this._log = new Sequenx.Log("");
            else if (typeof nameOrLog === "string")
                this._log = new Sequenx.Log(nameOrLog);
            else
                this._log = nameOrLog;
            this._refCountDisposable = new Sequenx.RefCountDisposable(Sequenx.Disposable.create(function () { return _this.lapseCompleted(); }));
        }
        Object.defineProperty(Lapse.prototype, "name", {
            get: function () {
                return this._log.name;
            },
            enumerable: true,
            configurable: true
        });
        Lapse.prototype.getChildLog = function (name) {
            return this._log.getChild(name);
        };
        Lapse.prototype.sustain = function (name) {
            if (this._isCompleted || this._isDisposed)
                return Sequenx.Disposable.empty;
            if (name && Sequenx.Log.isEnabled)
                this._log.info("Sustain " + name);
            return this._refCountDisposable.getDisposable();
        };
        Lapse.prototype.start = function (cb) {
            if (this._isStarted || this._isCompleted || this._isDisposed)
                return;
            this._isStarted = true;
            this._completed = cb;
            this._refCountDisposable.dispose();
        };
        Lapse.prototype.dispose = function () {
            if (this._isDisposed)
                return;
            if (!this._isCompleted) {
                this._log.info("Cancelling");
            }
            this.lapseCompleted();
        };
        Lapse.prototype.lapseCompleted = function () {
            if (this._isCompleted)
                return;
            this._isCompleted = true;
            this._isDisposed = true;
            this._log.dispose();
            this._completed && this._completed();
        };
        Lapse.prototype.sequence = function (action, message) {
            var sustain = this.sustain();
            var name = message ? message : 'Sequence';
            var log = this.getChildLog(name);
            var seq = new Sequenx.Sequence(log);
            action(seq);
            seq.start(function () { return sustain.dispose(); });
            return seq;
        };
        Lapse.prototype.child = function (action, message) {
            var sustain = this.sustain();
            var name = message ? message : 'Child';
            var log = this.getChildLog(name);
            var child = new Lapse(log);
            action(child);
            child.start(function () { return sustain.dispose(); });
        };
        return Lapse;
    }());
    Sequenx.Lapse = Lapse;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    Sequenx.Sequence.prototype.doLapse = function (action, message) {
        if (message === void 0) { message = "Lapse"; }
        var lapse = new Sequenx.Lapse(this.getChildLog(message));
        this.do(function (done) {
            action(lapse);
            lapse.start(done);
        });
        return this;
    };
})(Sequenx || (Sequenx = {}));
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
        Object.defineProperty(Log.prototype, "name", {
            get: function () {
                return this._name;
            },
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
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
        Log.prototype.format = function (message, params) {
            if (message && params != null && params.length > 0)
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
    }());
    Sequenx.Log = Log;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    Sequenx.Sequence.prototype.doPromise = function (action) {
        if (action instanceof Promise)
            this.do(function (done) { return action.then(function (v) { return done(); }); });
        else
            this.do(function (done) { return action().then(function (v) { return done(); }); });
        return this;
    };
    Sequenx.Sequence.prototype.startPromise = function () {
        var _this = this;
        return new Promise(function (resolve) { return _this.start(resolve); });
    };
})(Sequenx || (Sequenx = {}));

if (typeof module !== 'undefined' && module.exports)
    module.exports = Sequenx;


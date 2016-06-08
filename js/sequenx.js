var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
    var Lapse = (function () {
        function Lapse(nameOrLog) {
            var _this = this;
            this._completedSubject = new Rx.Subject();
            if (typeof nameOrLog === "string")
                this._log = new Sequenx.Log(name);
            else
                this._log = nameOrLog;
            this._refCountDisposable = new Rx.RefCountDisposable(Rx.Disposable.create(function () { return _this.lapseCompleted(); }));
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
        Object.defineProperty(Lapse.prototype, "name", {
            get: function () {
                return this._log.name;
            },
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
        Lapse.prototype.getChildLog = function (name) {
            return this._log.getChild(name);
        };
        Lapse.prototype.sustain = function (name) {
            if (this._isCompleted || this._isDisposed)
                return Rx.Disposable.empty;
            if (name && Sequenx.Log.isEnabled)
                this._log.info("Sustain " + name);
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
            this.lapseCompleted();
        };
        Lapse.prototype.lapseCompleted = function () {
            if (this._isCompleted)
                return;
            this._isCompleted = true;
            this._isDisposed = true;
            this._log.dispose();
            this._completedSubject.onCompleted();
        };
        Lapse.prototype.onCompleted = function (action) {
            return this.completed.subscribeOnCompleted(action);
        };
        Lapse.prototype.sequence = function (action, message) {
            var sustain = this.sustain();
            var name = message ? message : 'Sequence';
            var log = this.getChildLog(name);
            var seq = new Sequenx.Sequence(log);
            seq.onCompleted(function () { return sustain.dispose(); });
            action(seq);
            seq.start();
            return seq;
        };
        Lapse.prototype.child = function (action, message) {
            var sustain = this.sustain();
            var name = message ? message : 'Child';
            var log = this.getChildLog(name);
            var child = new Lapse(log);
            child.onCompleted(function () { return sustain.dispose(); });
            action(child);
            child.start();
        };
        Lapse.prototype.disposeOnComplete = function (disposable) {
            this.onCompleted(function () { return disposable.dispose(); });
        };
        return Lapse;
    }());
    Sequenx.Lapse = Lapse;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Sequence = (function () {
        function Sequence(nameOrLog) {
            this._lapseDisposables = new Rx.CompositeDisposable();
            this._currentLapseDisposable = Rx.Disposable.empty;
            this._pendingExecution = Rx.Disposable.empty;
            this._items = new Array();
            this._completedSubject = new Rx.Subject();
            if (nameOrLog) {
                if (typeof nameOrLog === "string")
                    this._log = new Sequenx.Log(nameOrLog);
                else
                    this._log = nameOrLog;
            }
        }
        Object.defineProperty(Sequence.prototype, "completed", {
            get: function () {
                return this._completedSubject;
            },
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Sequence.prototype, "name", {
            get: function () {
                return this._log.name;
            },
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
        Sequence.prototype.getChildLog = function (name) {
            return this._log.getChild(name);
        };
        Sequence.prototype.add = function (item) {
            if (!(item instanceof Sequenx.Item)) {
                this._log.error("Trying to add something other than Sequenx.Item, use do if you use a function(lapse)");
                return;
            }
            if (this._isDisposed)
                throw new Error("Trying to add action to a disposed sequence.");
            this._items.push(item);
        };
        Sequence.prototype.skip = function (predicate, cancelCurrent) {
            while (this._items.length > 0 && predicate(this._items[0]))
                this._items.splice(0, 1);
            if (cancelCurrent)
                this._currentLapseDisposable.dispose();
        };
        Sequence.prototype.skipTo = function (predicate, cancelCurrent) {
            var index = -1;
            for (var i = 0; i < this._items.length; i++) {
                if (predicate(this._items[i])) {
                    index = i;
                    break;
                }
            }
            if (index != -1) {
                this._items = this._items.slice(index);
                if (cancelCurrent)
                    this._currentLapseDisposable.dispose();
            }
        };
        Sequence.prototype.start = function () {
            if (this._isStarted || this._isDisposed)
                return;
            this._isStarted = true;
            this.scheduleNext();
        };
        Sequence.prototype.scheduleNext = function () {
            this._pendingExecution.dispose();
            this._pendingExecution = Rx.Scheduler.currentThread.schedule("item", this.executeNext.bind(this));
        };
        Sequence.prototype.executeNext = function (scheduler, state) {
            var _this = this;
            if (this._isExecuting || this._isCompleted || this._isDisposed)
                return;
            if (this._items.length === 0) {
                this.onLastItemCompleted();
                return;
            }
            var item = this._items.shift();
            if (!item.action) {
                if (item.message)
                    this._log.info("Message: " + item.message);
                return;
            }
            var lapse = new Sequenx.Lapse(this._log.getChild(item.message));
            this._currentLapseDisposable = lapse;
            this._lapseDisposables.add(lapse);
            lapse.onCompleted(function () {
                _this._isExecuting = false;
                _this.scheduleNext();
            });
            try {
                this._isExecuting = true;
                item.action(lapse);
                lapse.start();
            }
            catch (error) {
                this._isExecuting = false;
                this._log.error(error + "\n" + error.stack);
                this.scheduleNext();
            }
        };
        Sequence.prototype.onLastItemCompleted = function () {
            this.onSequenceComplete();
        };
        Sequence.prototype.dispose = function () {
            if (this._isDisposed)
                return;
            if (!this._isCompleted)
                this._log.info("Cancelling");
            this.onSequenceComplete();
        };
        Sequence.prototype.onSequenceComplete = function () {
            if (this._isCompleted)
                return;
            this._isCompleted = true;
            this._isDisposed = true;
            this._lapseDisposables.dispose();
            this._log.dispose();
            this._completedSubject.onCompleted();
        };
        Sequence.prototype.onCompleted = function (action) {
            return this.completed.subscribeOnCompleted(action);
        };
        Sequence.prototype.do = function (action, message) {
            if (action != null)
                this.add(new Item(action, message));
        };
        Sequence.prototype.doMark = function (marker) {
            var mark = marker ? marker : {};
            this.add(new Item(null, null, mark));
            return mark;
        };
        Sequence.prototype.skipToMarker = function (marker, cancelCurrent) {
            cancelCurrent = cancelCurrent == undefined ? false : cancelCurrent;
            this.skipTo(function (x) { return x.data === marker; }, cancelCurrent);
        };
        Sequence.prototype.skipToEnd = function (cancelCurrent) {
            cancelCurrent = cancelCurrent == undefined ? false : cancelCurrent;
            this.skip(function (x) { return true; }, cancelCurrent);
        };
        Sequence.prototype.doWait = function (duration, message) {
            this.do(function (lapse) {
                var sustain = lapse.sustain();
                setTimeout(function () { sustain.dispose(); });
            }, message ? message : "Wait " + (duration / 1000) + "s");
        };
        Sequence.prototype.doWaitForDispose = function (message) {
            var disposable = new Rx.SingleAssignmentDisposable();
            this.do(function (lapse) { return disposable.setDisposable(lapse.sustain()); }, message ? message : "WaitForDispose");
            return disposable;
        };
        Sequence.prototype.doWaitForCompleted = function (observable, message) {
            var disposable = new Rx.SingleAssignmentDisposable();
            observable.subscribeOnCompleted(function () { return disposable.dispose(); });
            this.do(function (lapse) { return disposable.setDisposable(lapse.sustain()); }, message ? message : "WaitForCompleted");
        };
        Sequence.prototype.doWaitForNext = function (observable, message) {
            var disposable = new Rx.SingleAssignmentDisposable();
            observable.subscribeOnNext(function () { return disposable.dispose(); });
            this.do(function (lapse) { return disposable.setDisposable(lapse.sustain()); }, message ? message : "WaitForNext");
        };
        Sequence.prototype.doWaitFor = function (completable, message) {
            this.doWaitForCompleted(completable.completed, message);
        };
        Sequence.prototype.doParallel = function (action, message) {
            this.do(function (lapse) {
                var parallel = new Sequenx.Parallel(lapse);
                action(parallel);
            }, message ? message : "Parallel");
        };
        Sequence.prototype.doDispose = function (disposable, message) {
            this.do(function (lapse) { return disposable.dispose(); }, message ? message : "Dispose");
        };
        Sequence.prototype.doSequence = function (action, message) {
            var _this = this;
            this.do(function (lapse) {
                var sustain = lapse.sustain();
                var log = _this.getChildLog(message);
                var seq = new Sequence(log);
                seq.onCompleted(function () { return sustain.dispose(); });
                lapse.onCompleted(seq.dispose);
                action(seq);
                seq.start();
            }, message ? message : "Sequence");
        };
        return Sequence;
    }());
    Sequenx.Sequence = Sequence;
    var Item = (function () {
        function Item(action, message, data) {
            this.action = action ? action : function () { };
            this.message = message;
            this.data = data;
        }
        Item.prototype.toString = function () {
            return "[Item] msg %s action %s data %s", this.message, this.action != null, this.data;
        };
        return Item;
    }());
    Sequenx.Item = Item;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Parallel = (function (_super) {
        __extends(Parallel, _super);
        function Parallel(lapse) {
            _super.call(this);
            this._lapse = lapse;
        }
        Object.defineProperty(Parallel.prototype, "completed", {
            get: function () {
                return this._lapse.completed;
            },
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Parallel.prototype, "name", {
            get: function () {
                return this._lapse.name;
            },
            set: function (value) { },
            enumerable: true,
            configurable: true
        });
        Parallel.prototype.getChildLog = function (name) {
            return this._lapse.getChildLog(name);
        };
        Parallel.prototype.add = function (item) {
            if (!(item instanceof Sequenx.Item)) {
                this._log.error("Trying to add() something other than Sequenx.Item, use do if you use a function(lapse)");
                return;
            }
            this._lapse.child(item.action, item.message);
        };
        Parallel.prototype.skip = function (predicate, cancelCurrent) {
            throw new Error("skip not implemented for Parallel");
        };
        Parallel.prototype.skipTo = function (predicate, cancelCurrent) {
            throw new Error("skipTo not implemented for Parallel");
        };
        return Parallel;
    }(Sequenx.Sequence));
    Sequenx.Parallel = Parallel;
})(Sequenx || (Sequenx = {}));

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
        Lapse.prototype.getChildLog = function (name) {
            return this._log.getChild(name);
        };
        Lapse.prototype.sustain = function (name) {
            if (this._isCompleted || this._isDisposed)
                return Rx.Disposable.empty;
            if (name && Sequenx.Log.isEnabled)
                this._log.warning("Sustain " + name);
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
            return this._completedSubject.subscribeOnCompleted(action);
        };
        Lapse.prototype.sequence = function (action, message) {
            var sustain = this.sustain();
            var name = message ? message : 'Sequence';
            var log = this.getChildLog(name);
            var seq = new Sequenx.Sequence(log);
            seq.onCompleted(sustain.dispose);
            action(seq);
            seq.start();
            return seq;
        };
        Lapse.prototype.child = function (action, message) {
            var sustain = this.sustain();
            var name = message ? message : 'Child';
            var log = this.getChildLog(name);
            var child = new Lapse(log);
            child.onCompleted(sustain.dispose);
            action(child);
            child.start();
        };
        Lapse.prototype.disposeOnComplete = function (disposable) {
            this.onCompleted(disposable.dispose);
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
            if (typeof nameOrLog === "string")
                this._log = new Sequenx.Log(nameOrLog);
            else
                this._log = nameOrLog;
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
        Sequence.prototype.getChildLog = function (name) {
            return this._log.getChild(name);
        };
        Sequence.prototype.add = function (item) {
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
                this._log.error(error);
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
            this._completedSubject.onCompleted();
            this._log.dispose();
        };
        Sequence.prototype.onCompleted = function (action) {
            return this._completedSubject.subscribeOnCompleted(action);
        };
        Sequence.prototype.do = function (action, message) {
            if (action != null)
                this.add(new Item(action, message));
        };
        return Sequence;
    }());
    Sequenx.Sequence = Sequence;
    var Item = (function () {
        function Item(action, message, data) {
            this.action = action;
            this.message = message;
            this.data = data;
        }
        return Item;
    }());
    Sequenx.Item = Item;
})(Sequenx || (Sequenx = {}));
var Sequenx;
(function (Sequenx) {
    var Parallel = (function () {
        function Parallel(lapse) {
            if (!(lapse instanceof Sequenx.Lapse))
                throw new Error("Parallel only support Sequenx.Lapse implementation!");
            this._lapse = lapse;
        }
        Object.defineProperty(Parallel.prototype, "completed", {
            get: function () {
                return this._lapse.completed;
            },
            set: function (value) {
            },
            enumerable: true,
            configurable: true
        });
        Parallel.prototype.getChildLog = function (name) {
            return this._lapse.getChildLog(name);
        };
        Parallel.prototype.add = function (item) {
            this._lapse.child(item.action, item.message);
        };
        Parallel.prototype.skip = function (predicate, cancelCurrent) {
            throw new Error("skip not implemented for Parallel");
        };
        Parallel.prototype.skipTo = function (predicate, cancelCurrent) {
            throw new Error("skipTo not implemented for Parallel");
        };
        return Parallel;
    }());
    Sequenx.Parallel = Parallel;
})(Sequenx || (Sequenx = {}));

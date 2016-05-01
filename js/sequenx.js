var Sequenx;
(function (Sequenx) {
    var Lapse = (function () {
        function Lapse(name) {
            var _this = this;
            this._completedSubject = new Rx.Subject();
            this.name = name;
            this.id = Lapse.nextId++;
            console.log("Lapse " + this.name + " (" + this.id + ") STARTED");
            this._refCountDisposable = new Rx.RefCountDisposable(Rx.Disposable.create(function () {
                console.log("Lapse " + _this.name + " (" + _this.id + ") COMPLETED");
                _this._completedSubject.onNext(null);
                _this._completedSubject.onCompleted();
            }));
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
                return Rx.Disposable.create(function () {
                    console.log("Lapse " + _this.name + " (" + _this.id + ") RELEASED ----- " + description);
                    disposable_1.dispose();
                });
            }
            return Rx.Disposable.empty;
        };
        Lapse.prototype.dispose = function () {
            if (this._refCountDisposable != null)
                this._refCountDisposable.dispose();
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
            var lapse = new Sequenx.Lapse(item.lapseDescription);
            lapse.completed.subscribe(function () { }, null, function () {
                console.log('Sequence item finished ' + item.lapseDescription);
                _this._completedSubject.onNext(item.lapseDescription);
                if (_this._items.length > 0)
                    _this.doItem(_this._items.shift());
                else
                    _this.onSequenceComplete();
            });
            item.action(lapse);
            lapse.dispose();
        };
        Sequence.prototype.onSequenceComplete = function () {
            console.log("onSequenceComplete " + this.name);
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
//# sourceMappingURL=sequenx.js.map
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
//# sourceMappingURL=sequenx.js.map
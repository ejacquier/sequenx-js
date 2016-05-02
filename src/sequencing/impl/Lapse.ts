/// <reference path="../ICompletable.ts"/>
/// <reference path="../../../typings/rx.d.ts"/>

module Sequenx
{
    export class Lapse implements ILapse, Rx.IDisposable
    {
        public static EMPTY: ILapse = new Lapse("empty");
        public static VERBOSE: boolean = false;
        private static nextId: number = 1;

        private _refCountDisposable: Rx.RefCountDisposable;
        private _completedSubject: Rx.Subject<string> = new Rx.Subject<string>();
        private _extensionReleaseSubject: Rx.Subject<string> = new Rx.Subject<string>();
        private _disposables: Rx.CompositeDisposable;
        private _started: boolean = false;

        public name: string;
        public id: number;

        get completed(): Rx.IObservable<any>
        {
            return this._completedSubject;
        }

        get extensionReleased(): Rx.IObservable<any>
        {
            return this._extensionReleaseSubject;
        }

        constructor(name: string)
        {
            this.name = name;

            if (name == "empty")
            {

                return;
            }

            this.id = Lapse.nextId++;

            if (Lapse.VERBOSE)
                console.log("Lapse " + this.name + " (" + this.id + ") STARTED");

            this._refCountDisposable = new Rx.RefCountDisposable(Rx.Disposable.create(() =>
            {
                if (Lapse.VERBOSE)
                    console.log("Lapse " + this.name + " (" + this.id + ") COMPLETED");

                this._completedSubject.onCompleted();
                this._extensionReleaseSubject.onCompleted();

                //clear disposables since they're only used when we want to interrupt the Lapse
                this._disposables = null;

                this.dispose();
            }));

            if (this._disposables == null)
                this._disposables = new Rx.CompositeDisposable();
        }

        public extend(description: string, timer?: number): Rx.IDisposable
        {
            if (Lapse.VERBOSE)
                console.log("Lapse " + this.name + " (" + this.id + ") EXTENDED +++++ " + description);

            if (this._refCountDisposable != null)
            {
                if (this._refCountDisposable.isDisposed)
                    console.error("Extending disposed lapse: " + this.name + " (" + this.id + ")");

                const disposable = this._refCountDisposable.getDisposable();
                const reference = Rx.Disposable.create(() =>
                {
                    if (Lapse.VERBOSE)
                        console.log("Lapse " + this.name + " (" + this.id + ") RELEASED ----- " + description);
                    this._extensionReleaseSubject.onNext(description);

                    disposable.dispose();
                });

                this._disposables.add(reference);

                return reference;
            }
            return Rx.Disposable.empty;
        }

        public start(): void
        {
            this._started = true;
            this._refCountDisposable.dispose();
        }

        public dispose(): void
        {
            if (!this._started)
            {
                console.error("Trying to dipose a Lapse not yet started!");
                return;
            }

            if (this._disposables != null)
            {
                console.warn("Lapse " + this.name + " (" + this.id + ") INTERRUPTED ----- ");
                this._disposables.dispose();
            }

            this._disposables = null;
            this._refCountDisposable = null;
            this._completedSubject.dispose();
            this._extensionCompletedSubject.dispose();
        }
    }
}

/// <reference path="./ICompletable.ts"/>
/// <reference path="../../typings/rx.d.ts"/>

module Sequenx
{
    export class Lapse implements ILapse, Rx.IDisposable
    {
        public static Empty: ILapse = new Lapse("empty");
        private static nextId: number = 0;

        private _refCountDisposable: Rx.RefCountDisposable;
        private _completedSubject: Rx.Subject<any> = new Rx.Subject<any>();

        public name: string;
        public id: number;

        get completed(): Rx.IObservable<any>
        {
            return this._completedSubject;
        }

        constructor(name: string)
        {
            this.name = name;
            this.id = Lapse.nextId++;

            console.log("Lapse " + this.name + " (" + this.id + ") STARTED");

            this._refCountDisposable = new Rx.RefCountDisposable(Rx.Disposable.create(() =>
            {
                console.log("Lapse " + this.name + " (" + this.id + ") COMPLETED");

                this._completedSubject.onNext(null);
                this._completedSubject.onCompleted();
            }));
        }

        public extend(description: string, timer?: any): Rx.IDisposable
        {
            console.log("Lapse " + this.name + " (" + this.id + ") EXTENDED +++++ " + description);

            if (this._refCountDisposable != null)
            {
                if (this._refCountDisposable.isDisposed)
                    console.error("Extending disposed lapse: " + this.name + " (" + this.id + ")");

                const disposable = this._refCountDisposable.getDisposable();
                return Rx.Disposable.create(() =>
                {
                    console.log("Lapse " + this.name + " (" + this.id + ") RELEASED ----- " + description);

                    disposable.dispose();
                });
            }

            return Rx.Disposable.empty;
        }

        public dispose(): void
        {
            if (this._refCountDisposable != null)
                this._refCountDisposable.dispose();
        }
    }
}

/// <reference path="../ICompletable.ts"/>
/// <reference path="../../../typings/rx.d.ts"/>

module Sequenx
{
    export class Sequence implements ISequence, Rx.IDisposable
    {
        private _completedSubject: Rx.Subject<string> = new Rx.Subject<string>();

        public name: string;
        private _lapse: Lapse;
        private _items: Array<SequenceItem>;
        private _completeObserver;

        get completed(): Rx.IObservable<any>
        {
            return this._completedSubject;
        }

        constructor(name: string, lapse: Lapse)
        {
            this.name = name;
            this._lapse = lapse;
            this._items = new Array<SequenceItem>();
        }

        public add(action: (lapse: ILapse) => void, lapseDescription: string, timer?: number): void
        {
            this._items.push(new SequenceItem(action, lapseDescription, timer));
        }

        public start()
        {
            console.log("Starting sequence " + this.name);

            if (this._items.length > 0)
                this.doItem(this._items.shift());
            else
                this.onSequenceComplete();
        }

        private doItem(item: SequenceItem)
        {
            console.log("Sequence doItem " + item.toString());

            var lapse = new Lapse(item.lapseDescription);
            lapse.completed.subscribe(() => {}, null, () =>
            {
                console.log('Sequence item finished ' + item.lapseDescription);

                this._completedSubject.onNext(item.lapseDescription);
                if (this._items.length > 0)
                    this.doItem(this._items.shift());
                else
                    this.onSequenceComplete();
            });
            item.action(lapse);
            lapse.dispose();
        }

        private onSequenceComplete()
        {
            console.log("onSequenceComplete " + this.name);
            this._completedSubject.onCompleted();
        }

        public dispose(): void
        {
        }

    }

    class SequenceItem
    {
        public action: (lapse: ILapse) => void;
        public lapseDescription: string;
        public timer: number = null;

        constructor(action: (lapse: ILapse) => void, lapseDescription: string, timer?: number)
        {
            this.action = action;
            this.lapseDescription = lapseDescription;
            this.timer = timer;
        }

        public toString(): string
        {
            return this.lapseDescription;
        }
    }
}

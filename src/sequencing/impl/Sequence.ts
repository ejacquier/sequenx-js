/// <reference path="../ICompletable.ts"/>
/// <reference path="../../../typings/rx.d.ts"/>

module Sequenx
{
    export class Sequence implements ISequence, Rx.IDisposable
    {
        private _completedSubject: Rx.Subject<string> = new Rx.Subject<string>();

        public name: string;
        public _lapse: Lapse;
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

            console.log('Create sequence ' + name);
        }

        public add(action: (lapse: ILapse) => void, lapseDescription: string, timer?: number): void
        {
            this._items.push(new SequenceItem(action, lapseDescription, timer));
        }

        public addParallel(action: (parallel: IParallel) => void, name: string): void
        {
            const lapse = new Lapse("parallel:" + name);
            const parallel = new Parallel(name, lapse);
            action(parallel);

            const sequenceItem = new SequenceItem(null, lapse.name, null);
            sequenceItem.parallel = parallel;
            this._items.push(sequenceItem);
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

            //TODO Refractor this (working) mess :(

            let lapse;
            if (this instanceof Parallel) //if we are in a Parallel sequence, reuse the same lapse
            {
                lapse = this._lapse;
                lapse.completed.subscribe((nextItem) =>
                {
                    this._completedSubject.onNext(nextItem);
                }, null, () =>
                    {
                        //console.log('Parallel sequence finished ' + item.lapseDescription);

                        this.onSequenceComplete();
                    });
                item.action(lapse);
                for (let i = 0; i < this._items.length; i++)
                {
                    this._items[i].action(lapse);
                }

                lapse.dispose();
            }
            else if (item.parallel != null) //start the parallel sequenceItem
            {
                item.parallel.completed.subscribe(() => { }, null, () =>
                {
                    //console.log('Parallel finished ' + item.lapseDescription);

                    this._completedSubject.onNext(item.lapseDescription);
                    if (this._items.length > 0)
                        this.doItem(this._items.shift());
                    else
                        this.onSequenceComplete();
                });
                item.parallel.start();
                (<Sequence>item.parallel)._lapse.dispose();
            }
            else //process the sequenceItem
            {

                lapse = new Lapse(item.lapseDescription);

                lapse.completed.subscribe(() => { }, null, () =>
                {
                    //console.log('Sequence item finished ' + item.lapseDescription);

                    this._completedSubject.onNext(item.lapseDescription);
                    if (this._items.length > 0)
                        this.doItem(this._items.shift());
                    else
                        this.onSequenceComplete();
                });
                item.action(lapse);
                lapse.dispose();
            }


        }

        private onSequenceComplete()
        {
            //console.log("onSequenceComplete " + this.name);
            this._completedSubject.onCompleted();
        }

        public dispose(): void
        {
        }

    }

    interface ISequenceItem
    {
        execute(): void;
    }

    class SequenceItem
    {
        public action: (lapse: ILapse) => void;
        public lapseDescription: string;
        public timer: number = null;
        public parallel: IParallel = null;

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

/// <reference path="../ICompletable.ts"/>
/// <reference path="../IParallel.ts"/>
/// <reference path="./Parallel.ts"/>
/// <reference path="./Lapse.ts"/>
/// <reference path="../../../typings/rx.d.ts"/>

module Sequenx
{
    export class Sequence implements ISequence, Rx.IDisposable
    {
        private _log:ILog;
        private _lapseDisposables:Rx.CompositeDisposable = new Rx.CompositeDisposable();
        private _items: Array<Item> = new Array<Item>();
        private _completedSubject: Rx.Subject<string> = new Rx.Subject<string>();
        
        private _isStarted:boolean;
        private _isDisposed:boolean;
        private _isCompleted:boolean;

        get completed(): Rx.IObservable<any>
        {
            return this._completedSubject;
        }

        set completed(value: Rx.IObservable<any>)
        {

        }

        constructor(nameOrLog: string | ILog)
        {
            if (typeof nameOrLog === "string")
                this._log = new Log(nameOrLog);
            else
                this._log = nameOrLog;
        }
        
        public getChildLog(name:string):ILog
        {
            return this._log.getChild(name);
        }

        public add(action: (lapse: ILapse) => void, message: string): void
        {
            this._items.push(new SequenceItem(action, lapseDescription, timer));
        }

        public addParallel(action: (parallel: IParallel) => void, name: string): void
        {
            const lapse = new Lapse("parallel:" + name);
            const parallel = new Parallel(name, lapse);
            action(parallel);

            const sequenceItem = new SequenceItem(null, "", null);
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

                lapse.start();
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
                (<Sequence>item.parallel)._lapse.start();
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
                lapse.start();
            }
        }

        private onSequenceComplete()
        {
            //console.log("onSequenceComplete " + this.name);
            this._completedSubject.onCompleted();
            this._disposable.dispose();
        }

        public dispose(): void
        {
        }

    }

    interface ISequenceItem
    {
        execute(): void;
    }

    class Item
    {
        public action: (lapse: ILapse) => void;
        public message: string;

        constructor(action: (lapse: ILapse) => void, message: string)
        {
            this.action = action;
            this.message = message;
        }
    }

}

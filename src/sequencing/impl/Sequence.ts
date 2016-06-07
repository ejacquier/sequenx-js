/// <reference path="../ICompletable.ts"/>
/// <reference path="../IParallel.ts"/>
/// <reference path="./Parallel.ts"/>
/// <reference path="./Lapse.ts"/>
/// <reference path="../../../typings/rx.d.ts"/>

module Sequenx
{
    export class Sequence implements ISequence, Rx.IDisposable
    {
        private _log: ILog;
        private _lapseDisposables: Rx.CompositeDisposable = new Rx.CompositeDisposable();
        private _currentLapseDisposable: Rx.IDisposable = Rx.Disposable.empty;
        private _pendingExecution: Rx.IDisposable = Rx.Disposable.empty;
        private _items: Array<Item> = new Array<Item>();
        private _completedSubject: Rx.Subject<string> = new Rx.Subject<string>();

        private _isStarted: boolean;
        private _isDisposed: boolean;
        private _isCompleted: boolean;
        private _isExecuting: boolean;

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

        public getChildLog(name: string): ILog
        {
            return this._log.getChild(name);
        }

        public add(item: Item): void
        {
            if (this._isDisposed)
                throw new Error("Trying to add action to a disposed sequence.");

            this._items.push(item);
        }

        public skip(predicate: (item: Item) => boolean, cancelCurrent: boolean): void
        {
            // Skip items until reaching a non-matching one
            while (this._items.length > 0 && predicate(this._items[0]))
                this._items.splice(0, 1);

            if (cancelCurrent)
                this._currentLapseDisposable.dispose();
        }

        public skipTo(predicate: (item: Item) => boolean, cancelCurrent: boolean): void
        {
            let index = -1;
            for (let i = 0; i < this._items.length; i++) 
            {
                if (predicate(this._items[i]))
                {
                    index = i;
                    break;
                }
            }

            if (index != -1)
            {
                this._items = this._items.slice(index);

                if (cancelCurrent)
                    this._currentLapseDisposable.dispose();
            }
        }

        public start()
        {
            if (this._isStarted || this._isDisposed)
                return;

            this._isStarted = true;
            this.scheduleNext();
        }

        protected scheduleNext(): void
        {
            this._pendingExecution.dispose();
            this._pendingExecution = Rx.Scheduler.currentThread.schedule("item", this.executeNext.bind(this));
        }

        private executeNext(scheduler: Rx.IScheduler, state: string): Rx.IDisposable
        {
            if (this._isExecuting || this._isCompleted || this._isDisposed)
                return;

            // Nothing left to execute?
            if (this._items.length === 0)
            {
                this.onLastItemCompleted();
                return;
            }

            // Pop first item out of queue
            const item = this._items.shift();

            // Non-actionable item?
            if (!item.action)
            {
                // Any message attached?
                if (item.message)
                    this._log.info("Message: " + item.message);

                return;
            }

            // Create lapse
            const lapse = new Lapse(this._log.getChild(item.message));
            this._currentLapseDisposable = lapse;
            this._lapseDisposables.add(lapse);

            lapse.onCompleted(() =>
            {
                this._isExecuting = false;
                this.scheduleNext();
            });

            // Execute item
            try
            {
                this._isExecuting = true;
                item.action(lapse);
                lapse.start();
            }
            catch (error)
            {
                this._isExecuting = false;
                this._log.error(error);
                this.scheduleNext();
            }
        }

        protected onLastItemCompleted()
        {
            this.onSequenceComplete();
        }

        public dispose(): void
        {
            if (this._isDisposed)
                return;

            if (!this._isCompleted)
                this._log.info("Cancelling");

            this.onSequenceComplete();
        }

        private onSequenceComplete()
        {
            if (this._isCompleted)
                return;

            this._isCompleted = true;
            this._isDisposed = true;
            this._lapseDisposables.dispose();
            this._completedSubject.onCompleted();
            this._log.dispose();
        }

        // ICompletableExtensions

        public onCompleted(action: () => void): Rx.IDisposable
        {
            return this._completedSubject.subscribeOnCompleted(action);
        }

        // ISequenceExtensions

        public do(action: (lapse: ILapse) => void, message?: string)
        {
            if (action != null)
                this.add(new Item(action, message))
        }

    }

    interface ISequenceItem
    {
        execute(): void;
    }

    export class Item
    {
        public action: (lapse: ILapse) => void;
        public message: string;
        public data: any;

        constructor(action: (lapse: ILapse) => void, message?: string, data?: any)
        {
            this.action = action;
            this.message = message;
            this.data = data;
        }
    }
}
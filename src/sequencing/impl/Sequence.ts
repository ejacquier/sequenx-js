/// <reference path="../ICompletable.ts"/>
/// <reference path="../IParallel.ts"/>
/// <reference path="./Parallel.ts"/>
/// <reference path="./Lapse.ts"/>
/// <reference path="../../../typings/rx.d.ts"/>

module Sequenx
{
    export class Sequence implements ISequence, Rx.IDisposable
    {
        protected _log: ILog;
        private _lapseDisposables: Rx.CompositeDisposable = new Rx.CompositeDisposable();
        private _currentLapseDisposable: Rx.IDisposable = Rx.Disposable.empty;
        private _pendingExecution: Rx.IDisposable = Rx.Disposable.empty;
        private _items: Array<Item> = new Array<Item>();
        private _completedSubject: Rx.Subject<string> = new Rx.Subject<string>();

        private _isStarted: boolean;
        private _isDisposed: boolean;
        private _isCompleted: boolean;
        private _isExecuting: boolean;

        get completed(): Rx.Observable<any>
        {
            return this._completedSubject;
        }

        set completed(value: Rx.Observable<any>) { }

        get name(): string
        {
            return this._log.name;
        }

        set name(value: string) { }

        constructor(nameOrLog?: string | ILog)
        {
            if (nameOrLog)
            {
                if (typeof nameOrLog === "string")
                    this._log = new Log(nameOrLog);
                else
                    this._log = nameOrLog;
            }
        }

        public getChildLog(name: string): ILog
        {
            return this._log.getChild(name);
        }

        public add(item: Item): void
        {
            if (!(item instanceof Sequenx.Item))
            {
                this._log.error("Trying to add something other than Sequenx.Item, use do if you use a function(lapse)");
                return;
            }
            
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

                this._isExecuting = false;
                this.scheduleNext();
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
                //Cancel sequence if there was an error
                this.dispose();
                throw error;
                //this._log.error(error + "\n" + error.stack);
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
            this._log.dispose();
            this._completedSubject.onCompleted();
        }

        // ICompletableExtensions

        public onCompleted(action: () => void): Rx.IDisposable
        {
            return this.completed.subscribeOnCompleted(action);
        }

        // ISequenceExtensions

        public do(action: (lapse?: ILapse) => void, message?: string): void
        {
            if (action != null)
                this.add(new Item(action, message));
        }

        public doMark(marker?: any): any
        {
            const mark = marker ? marker : {};
            this.add(new Item(null, null, mark));
            return mark;
        }

        public skipToMarker(marker: any, cancelCurrent?: boolean): void
        {
            cancelCurrent = cancelCurrent == undefined ? false : cancelCurrent;
            this.skipTo(x => x.data === marker, cancelCurrent);
        }

        public skipToEnd(cancelCurrent?: boolean): void
        {
            cancelCurrent = cancelCurrent == undefined ? false : cancelCurrent;
            this.skip(x => true, cancelCurrent);
        }

        public doWait(duration: number, message?: string): void
        {
            this.do(lapse =>
            {
                const sustain = lapse.sustain();
                setTimeout(() => { sustain.dispose() }, duration);
            }, message ? message : "Wait " + (duration / 1000) + "s");
        }

        public doWaitForDispose(message?: string): Rx.IDisposable
        {
            const disposable = new Rx.SingleAssignmentDisposable();
            this.do(lapse => disposable.setDisposable(lapse.sustain()), message ? message : "WaitForDispose");
            return disposable;
        }

        public doWaitForCompleted<T>(observable: Rx.Observable<T>, message?: string): void
        {
            const disposable = new Rx.SingleAssignmentDisposable();
            observable.subscribeOnCompleted(() => disposable.dispose());
            this.do(lapse => disposable.setDisposable(lapse.sustain()), message ? message : "WaitForCompleted");
        }

        public doWaitForNext<T>(observable: Rx.Observable<T>, message?: string): void
        {
            const disposable = new Rx.SingleAssignmentDisposable();
            observable.subscribeOnNext(() => disposable.dispose());
            this.do(lapse => disposable.setDisposable(lapse.sustain()), message ? message : "WaitForNext");
        }

        public doWaitFor(completable: ICompletable, message?: string): void
        {
            this.doWaitForCompleted(completable.completed, message);
        }

        public doParallel(action: (parallel: IParallel) => void, message?: string): void
        {
            this.do(lapse => 
            {
                const parallel = new Parallel(lapse);
                action(parallel);
            }, message ? message : "Parallel");
        }

        public doDispose(disposable: Rx.IDisposable, message?: string): void
        {
            this.do(lapse => disposable.dispose(), message ? message : "Dispose");
        }

        public doSequence(action: (sequence: ISequence) => void, message?: string): void
        {
            this.do(lapse => 
            {
                const sustain = lapse.sustain();

                const log = this.getChildLog(message);
                const seq = new Sequence(log);
                seq.onCompleted(() => sustain.dispose());
                lapse.onCompleted(seq.dispose);

                // Let action enqueue actions into sequence
                action(seq);

                seq.start();

            }, message ? message : "Sequence");
        }

    }

    export class Item
    {
        public action: (lapse?: ILapse) => void;
        public message: string;
        public data: any;

        constructor(action?: (lapse?: ILapse) => void, message?: string, data?: any)
        {
            this.action = action ? action : () => {};
            this.message = message;
            this.data = data;
        }
        
        public toString():string
        {
            return "[Item] msg %s action %s data %s", this.message, this.action != null, this.data;    
        }
    }
}
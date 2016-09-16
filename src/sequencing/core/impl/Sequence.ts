module Sequenx
{
    export interface Sequence extends ISequenceItem, IDisposable
    {
        // { do
        doDispose(disposable: IDisposable, message?: string): Sequence
        do(action: (done?: () => void) => void, message?: string): Sequence
        doWait(duration: number, message?: string): Sequence
        doWaitForDispose(duration: number, message?: string): IDisposable
        doMark(marker: any): Sequence
        // }
        // { skip
        skipToMarker(marker: any): void
        skipToEnd(): void
        skip(predicate: (item: ISequenceItem) => Boolean): void
        skipTo(predicate: (item: ISequenceItem) => boolean): void
        //}
    }

    export class Sequence implements Sequence
    {
        private _log: ILog;
        private _pendingExecution: IDisposable = Disposable.empty;
        protected _items: Array<ISequenceItem> = new Array<ISequenceItem>();

        private _isStarted: boolean = false;
        private _isDisposed: boolean = false;
        private _isCompleted: boolean = false;
        private _isExecuting: boolean = false;
        protected _cbComplete: () => void;

        get name(): string
        {
            return this._log.name;
        }

        constructor(nameOrLog?: string | ILog)
        {
            if (!nameOrLog)
                this._log = new Log("");
            else if (typeof nameOrLog === "string")
                this._log = new Log(nameOrLog);
            else
                this._log = nameOrLog;
        }

        public getChildLog(name: string): ILog
        {
            return this._log.getChild(name);
        }

        public add(item: ISequenceItem): void
        {
            if (!item.start)
            {
                this._log.error("Trying to add something other than Sequenx.Item, use do if you use a function(lapse)");
                return;
            }
            if (this._isDisposed)
                throw new Error("Trying to add action to a disposed sequence.");

            this._items.push(item);
        }

        public start(cb: () => void)
        {
            if (this._isStarted || this._isDisposed)
                return;

            this._isStarted = true;
            this._cbComplete = cb;
            this.scheduleNext();
        }

        protected scheduleNext(): void
        {
            this._pendingExecution.dispose();
            this.executeNext();
        }

        private executeNext()
        {
            if (this._isExecuting || this._isCompleted || this._isDisposed)
                return;

            // Nothing left to execute?
            if (this._items.length === 0)
            {
                this.onLastItemCompleted();
                return;
            }

            const item = this._items.shift();

            // Execute item
            try
            {
                this._isExecuting = true;
                item.start(() =>
                {
                    this._isExecuting = false;
                    this.scheduleNext();
                });
            }
            catch (error)
            {
                this._isExecuting = false;
                this.dispose();
                throw error;
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
                this._log.warning("Cancelling (" + this._items.length + " items)");

            this.onSequenceComplete();
        }

        private onSequenceComplete()
        {
            if (this._isCompleted)
                return;

            this._items.length = 0;
            this._isCompleted = true;
            this._isDisposed = true;
            this._log.dispose();
            this._cbComplete && this._cbComplete();
        }

        // { do

        public doDispose(disposable: IDisposable, message?: string): Sequence
        {
            this.do(() => disposable.dispose(), message ? message : "Dispose");
            return this;
        }

        public do(action: (done?: () => void) => void, message?: string): Sequence
        {
            this.add(new CallbackItem(action, message));
            return this;
        }

        public doWait(duration: number, message?: string): Sequence
        {
            this.do((done) => setTimeout(done, duration), message ? message : "Wait " + (duration / 1000) + "s");
            return this;
        }

        public doWaitForDispose(duration: number, message?: string): IDisposable
        {
            let disposable = new Disposable();
            this.do((done) => { disposable.action = done; },
                message ? message : "WaitForDispose");
            return disposable;
        }

        public doMark(marker: any): Sequence
        {
            this.add(new MarkItem(marker));
            return this;
        }

        public doParallel(action: (parallel: Parallel) => void, message?: string): Sequence
        {
            const parallel = new Parallel();
            parallel.message = message ? message : "Parallel";
            action(parallel);
            this.add(parallel);
            return this;
        }

        public doSequence(action: (sequence: Sequence) => void, message?: string): Sequence
        {
            message = message ? message : "Sequence";
            const sequence = new Sequence();
            //sequence.message = message;
            action(sequence);
            this.add(sequence);
            return this;
        }

        // }
        // { skip

        public skipToMarker(marker: any, cancelCurrent: boolean = false): void
        {
            this.skipTo(x => x instanceof MarkItem && x.marker === marker);
        }

        public skipToEnd(): void
        {
            this.skip(x => true);
        }

        public skip(predicate: (item: ISequenceItem) => boolean): void
        {
            // Skip items until reaching a non-matching one
            while (this._items.length > 0 && predicate(this._items[0]))
                this._items.splice(0, 1);
        }

        public skipTo(predicate: (item: ISequenceItem) => boolean): void
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

            if (index !== -1)
            {
                this._items = this._items.slice(index);
            }
        }

        // }
    }
}
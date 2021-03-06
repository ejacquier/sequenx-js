/// <reference path="../ILapse.ts"/>

module Sequenx
{
    export class Lapse implements ILapse, ISequenceItem
    {
        private _log: ILog;
        private _isStarted: boolean;
        private _isDisposed: boolean;
        private _isCompleted: boolean;
        private _refCountDisposable: RefCountDisposable;
        private _completed: () => void;

        get name(): string
        {
            return this._log.name;
        }

        constructor(nameOrLog?: string | ILog, private autoStart = false)
        {
            if (!nameOrLog)
                this._log = new Log("");
            else if (typeof nameOrLog === "string")
                this._log = new Log(nameOrLog);
            else
                this._log = nameOrLog as ILog;
            this._refCountDisposable = new RefCountDisposable(Disposable.create(() => this.lapseCompleted()));
            if (autoStart)
                setTimeout(() => this.start(), 0);
        }

        public getChildLog(name: string): ILog
        {
            return this._log.getChild(name);
        }

        public sustain(name?: string): IDisposable
        {
            if (this._isCompleted || this._isDisposed)
                return Disposable.empty;

            if (name && Log.isEnabled)
                this._log.info("Sustain " + name);

            return this._refCountDisposable.getDisposable();
        }

        public onCompleted(cb: () => void)
        {
            this._completed = cb;
        }

        public start(cb?: () => void): void
        {
            if (this._isStarted || this._isCompleted || this._isDisposed)
                return;

            this._isStarted = true;
            this._completed = cb || this._completed;
            this._refCountDisposable.dispose();
        }

        public dispose(): void
        {
            if (this._isDisposed)
                return;

            if (!this._isCompleted)
            {
                this._log.info("Cancelling");
            }

            this.lapseCompleted();
        }

        private lapseCompleted(): void
        {
            if (this._isCompleted)
                return;

            this._isCompleted = true;
            this._isDisposed = true;
            this._log.dispose();

            this._completed && this._completed();
        }

        //ILapseExtensions

        public sequence(action: (seq: Sequence) => void, message?: string): Sequence
        {
            const sustain = this.sustain();
            const name = message ? message : 'Sequence';
            const log = this.getChildLog(name);
            const seq = new Sequence(log);
            action(seq);
            seq.start(() => sustain.dispose());

            return seq;
        }

        public child(action: (lapse: ILapse) => void, message?: string): void
        {
            const sustain = this.sustain();
            const name = message ? message : 'Child';
            const log = this.getChildLog(name);
            const child = new Lapse(log);
            action(child);
            child.start(() => sustain.dispose());
        }
    }
}

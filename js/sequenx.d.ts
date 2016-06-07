/// <reference path="../typings/rx.d.ts" />
declare module Sequenx {
    interface ILog extends Rx.IDisposable {
        getChild(name: string): ILog;
        info(message: string, ...params: any[]): void;
        warning(message: string, ...params: any[]): void;
        error(message: string, ...params: any[]): void;
    }
}
declare module Sequenx {
    class Log implements ILog {
        private static PathSeparator;
        private static MessageSeparator;
        private static StartSuffix;
        private static EndSuffix;
        private static s_nextId;
        static isEnabled: boolean;
        private _parent;
        private _name;
        private _id;
        private _fullName;
        private _isDisposed;
        constructor(name: string, parent?: Log);
        toString(): string;
        dispose(): void;
        getChild(name: string): ILog;
        info(message: string, ...params: any[]): void;
        warning(message: string, ...params: any[]): void;
        error(message: string, ...params: any[]): void;
        fullName: string;
        private getNameWithId();
        private format(message, ...params);
        private strFormat(str, ...params);
    }
}
declare module Sequenx {
    interface ICompletable {
        completed: Rx.IObservable<any>;
    }
}
declare module Sequenx {
    interface ILapse extends ICompletable {
        sustain(): Rx.IDisposable;
        getChildLog(name: string): ILog;
    }
}
declare module Sequenx {
    interface ISequence extends ICompletable {
        add(item: Item): void;
        skip(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        skipTo(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        getChildLog(name: string): ILog;
    }
}
declare module Sequenx {
    interface IParallel extends ISequence {
    }
}
declare module Sequenx {
    class Lapse implements ILapse, Rx.IDisposable {
        private _isStarted;
        private _isDisposed;
        private _isCompleted;
        private _refCountDisposable;
        private _completedSubject;
        private _log;
        completed: Rx.IObservable<any>;
        constructor(nameOrLog: string | ILog);
        getChildLog(name: string): ILog;
        sustain(name?: string): Rx.IDisposable;
        start(): void;
        dispose(): void;
        private lapseCompleted();
        onCompleted(action: () => void): Rx.IDisposable;
        sequence(action: (seq: ISequence) => void, message?: string): Rx.IDisposable;
        child(action: (lapse: ILapse) => void, message?: string): void;
        disposeOnComplete(disposable: Rx.IDisposable): void;
    }
}
declare module Sequenx {
    class Sequence implements ISequence, Rx.IDisposable {
        private _log;
        private _lapseDisposables;
        private _currentLapseDisposable;
        private _pendingExecution;
        private _items;
        private _completedSubject;
        private _isStarted;
        private _isDisposed;
        private _isCompleted;
        private _isExecuting;
        completed: Rx.IObservable<any>;
        constructor(nameOrLog: string | ILog);
        getChildLog(name: string): ILog;
        add(item: Item): void;
        skip(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        skipTo(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        start(): void;
        protected scheduleNext(): void;
        private executeNext(scheduler, state);
        protected onLastItemCompleted(): void;
        dispose(): void;
        private onSequenceComplete();
        onCompleted(action: () => void): Rx.IDisposable;
        do(action: (lapse: ILapse) => void, message?: string): void;
    }
    class Item {
        action: (lapse: ILapse) => void;
        message: string;
        data: any;
        constructor(action: (lapse: ILapse) => void, message?: string, data?: any);
    }
}
declare module Sequenx {
    class Parallel implements IParallel {
        private _lapse;
        constructor(lapse: ILapse);
        completed: Rx.IObservable<any>;
        getChildLog(name: string): ILog;
        add(item: Item): void;
        skip(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        skipTo(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
    }
}

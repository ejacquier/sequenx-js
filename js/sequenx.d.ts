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
    }
}
declare module Sequenx {
    interface ISequence extends ICompletable {
        add(action: (lapse: ILapse) => void, lapseDescription: string, timer?: number): void;
        addParallel(action: (parallel: IParallel) => void, name: string): void;
        start(): void;
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
        constructor(name: string);
        sustain(): Rx.IDisposable;
        start(): void;
        dispose(): void;
        private onCompleted();
    }
}
declare module Sequenx {
    class Sequence implements ISequence, Rx.IDisposable {
        private _completedSubject;
        name: string;
        _lapse: Lapse;
        private _items;
        private _completeObserver;
        private _disposable;
        completed: Rx.IObservable<any>;
        constructor(name: string, lapse: Lapse);
        add(action: (lapse: ILapse) => void, lapseDescription: string, timer?: number): void;
        addParallel(action: (parallel: IParallel) => void, name: string): void;
        start(): void;
        private doItem(item);
        private onSequenceComplete();
        dispose(): void;
    }
}
declare module Sequenx {
    class Parallel extends Sequence implements IParallel {
    }
}

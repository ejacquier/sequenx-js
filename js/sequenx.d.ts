declare module Sequenx {
    interface IDisposable {
        dispose(): void;
    }
    class Disposable implements IDisposable {
        action: () => void;
        static empty: Disposable;
        static create(action: () => void): Disposable;
        private _isDisposed;
        constructor(action?: () => void);
        isDisposed: boolean;
        dispose(): void;
    }
    class RefCountDisposable extends Disposable {
        private disposable;
        private _count;
        private _self;
        constructor(disposable: Disposable);
        getDisposable(): IDisposable;
    }
}
declare module Sequenx {
    interface ILog extends IDisposable {
        getChild(name: string): ILog;
        info(message: string, ...params: any[]): void;
        warning(message: string, ...params: any[]): void;
        error(message: string, ...params: any[]): void;
        name: string;
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
        name: string;
        constructor(name: string, parent?: Log);
        toString(): string;
        dispose(): void;
        getChild(name: string): ILog;
        info(message: string, ...params: any[]): void;
        warning(message: string, ...params: any[]): void;
        error(message: string, ...params: any[]): void;
        fullName: string;
        private getNameWithId();
        private format(message, params);
        private strFormat(str, ...params);
    }
}
declare module Sequenx {
    interface ICompletable {
        onCompleted(action: () => void): any;
    }
}
declare module Sequenx {
    interface ISequenceItem {
        message?: string;
        start(cb?: () => void): any;
    }
}
declare module Sequenx {
    class CallbackItem implements ISequenceItem {
        action: (done?: () => void) => void;
        message: string;
        constructor(action: (done?: () => void) => void, message?: string);
        start(cb: () => void): void;
        toString(): string;
    }
}
declare module Sequenx {
    class MarkItem implements ISequenceItem {
        marker: any;
        message: string;
        private _callback;
        constructor(marker: any, message?: string);
        start(cb: () => void): void;
        toString(): string;
    }
}
declare module Sequenx {
    interface Sequence extends ISequenceItem, IDisposable {
        doDispose(disposable: IDisposable, message?: string): Sequence;
        do(action: (done?: () => void) => void, message?: string): Sequence;
        doWait(duration: number, message?: string): Sequence;
        doWaitForDispose(duration: number, message?: string): IDisposable;
        doMark(marker: any): Sequence;
        skipToMarker(marker: any): void;
        skipToEnd(): void;
        skip(predicate: (item: ISequenceItem) => Boolean): void;
        skipTo(predicate: (item: ISequenceItem) => boolean): void;
    }
    class Sequence implements Sequence {
        private _log;
        private _pendingExecution;
        protected _items: Array<ISequenceItem>;
        private _isStarted;
        private _isDisposed;
        private _isCompleted;
        private _isExecuting;
        protected _cbComplete: () => void;
        name: string;
        constructor(nameOrLog?: string | ILog);
        getChildLog(name: string): ILog;
        add(item: ISequenceItem): void;
        start(cb: () => void): void;
        protected scheduleNext(): void;
        private executeNext();
        protected onLastItemCompleted(): void;
        dispose(): void;
        private onSequenceComplete();
        doParallel(action: (parallel: Parallel) => void, message?: string): Sequence;
        doSequence(action: (sequence: Sequence) => void, message?: string): Sequence;
    }
}
declare module Sequenx {
    interface Parallel {
    }
    class Parallel extends Sequence implements Parallel, ISequenceItem {
        message: string;
        constructor();
        scheduleNext(): void;
        skip(predicate: (item: ISequenceItem) => boolean): void;
        skipTo(predicate: (item: ISequenceItem) => boolean): void;
    }
}
declare module Sequenx {
    interface ILapse extends IDisposable {
        sustain(name?: string): IDisposable;
        getChildLog(name: string): ILog;
        name: string;
        child(action: (lapse: ILapse) => void, message?: string): void;
        sequence(action: (seq: Sequence) => void, message?: string): Sequence;
    }
}
declare module Sequenx {
    class Lapse implements ILapse, ISequenceItem {
        private _log;
        private _isStarted;
        private _isDisposed;
        private _isCompleted;
        private _refCountDisposable;
        private _completed;
        name: string;
        constructor(nameOrLog?: string | ILog);
        getChildLog(name: string): ILog;
        sustain(name?: string): IDisposable;
        start(cb: () => void): void;
        dispose(): void;
        private lapseCompleted();
        sequence(action: (seq: Sequence) => void, message?: string): Sequence;
        child(action: (lapse: ILapse) => void, message?: string): void;
    }
}
declare module Sequenx {
    interface Sequence {
        doLapse(action: (lapse: Lapse) => void, message?: string): any;
    }
}
declare module Sequenx {
    interface Sequence {
        doPromise(action: Promise<any> | (() => Promise<any>)): any;
        startPromise(): Promise<any>;
    }
}

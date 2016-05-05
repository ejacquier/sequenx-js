/// <reference path="../typings/rx.d.ts" />
declare module Sequenx {
    interface ICompletable {
        completed: Rx.IObservable<any>;
    }
}
declare module Sequenx {
    interface ILapse extends ICompletable {
        extend(description: string, timer?: number): Rx.IDisposable;
        extensionCompleted: Rx.IObservable<any>;
    }
}
declare module Sequenx {
    class Lapse implements ILapse, Rx.IDisposable {
        static EMPTY: ILapse;
        static VERBOSE: boolean;
        private static nextId;
        private _refCountDisposable;
        private _completedSubject;
        private _extensionCompletedSubject;
        private _disposables;
        private _started;
        name: string;
        id: number;
        readonly completed: Rx.IObservable<any>;
        readonly extensionCompleted: Rx.IObservable<any>;
        constructor(name: string);
        extend(description: string, timer?: number): Rx.IDisposable;
        start(): void;
        dispose(): void;
    }
}
declare module Sequenx {
    class Sequence implements ISequence, Rx.IDisposable {
        private _completedSubject;
        name: string;
        _lapse: Lapse;
        private _items;
        private _completeObserver;
        readonly completed: Rx.IObservable<any>;
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
    class Parallel extends Sequence implements IParallel {
    }
}

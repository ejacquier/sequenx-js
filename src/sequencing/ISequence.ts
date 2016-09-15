/// <reference path="./ICompletable.ts"/>
/// <reference path="./ILapse.ts"/>

module Sequenx
{
    export interface ISequence extends ICompletable, Rx.IDisposable
    {
        skip(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        skipTo(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        getChildLog(name: string): ILog;

        name: string;

        //extensions
        onCompleted(action: () => void): Rx.IDisposable;
        do(action: (lapse?: ILapse) => void, message?: string): ISequence;
        doMark(marker?: any): ISequence;
        skipToMarker(marker: any, cancelCurrent: boolean): void;
        skipToEnd(cancelCurrent?: boolean): void;
        
        /** Enqueues into sequence a pause of given duration in milliseconds. */
        doWait(duration: number, message?: string): ISequence;
        /**
         * Enqueues into sequence a pause that will end as soon as returned disposable is disposed.      
         * If that condition is satisfied before-hand, no pause occurs.  
         * @param message message used for log
         */
        doWaitForDispose(message?: string): Rx.IDisposable;
        /**  Enqueues into sequence a pause that will end as soon as given observable completes.
        If that condition is satisfied before-hand, no pause occurs. */
        doWaitForCompleted<T>(observable: Rx.Observable<T>, message?: string): ISequence;
        /** Enqueues into sequence a pause that will end as soon as given observable provides next value.
        If that condition is satisfied before-hand, no pause occurs. */
        doWaitForNext<T>(observable: Rx.Observable<T>, message?: string): ISequence;
        /** nqueues into sequence a pause that will end as soon as given completable completes. (ILapse or ISequence)
        If that condition is satisfied before-hand, no pause occurs. */
        doWaitFor(completable: ICompletable, message?: string): ISequence;
        /** Enqueues into sequence a group of actions that will be executed altogether in parallel.  Only after all
        actions in the group have completed will the sequence continue with the next action. */
        doParallel(action: (parallel: IParallel) => void, message?: string): ISequence;
        /** Enqueues into sequence an action that will dispose the given disposable. */
        doDispose(disposable: Rx.IDisposable, message?: string): ISequence;
        /** Enqueues into sequence a group of actions that will be executed one by one */
        doSequence(action: (sequence: ISequence) => void, message?: string): ISequence;
    }
}

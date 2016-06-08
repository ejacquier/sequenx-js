/// <reference path="./ICompletable.ts"/>
/// <reference path="./ILapse.ts"/>

module Sequenx
{
    export interface ISequence extends ICompletable
    {
        skip(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        skipTo(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        getChildLog(name: string): ILog;
        
        name: string;
        
        //extensions
        onCompleted(action: () => void): Rx.IDisposable;
        do(action: (lapse?: ILapse) => void, message?: string): void;
        doMark(marker?: any): any;
        skipToMarker(marker: any, cancelCurrent: boolean): void;
        skipToEnd(cancelCurrent?: boolean): void;
        /** Enqueues into sequence a pause of given duration in milliseconds. */
        doWait(duration: number, message?: string): void;
        /** Enqueues into sequence a pause that will end as soon as returned disposable is disposed.
          If that condition is satisfied before-hand, no pause occurs.  */
        doWaitForDispose(message?:string):Rx.IDisposable;
        /**  Enqueues into sequence a pause that will end as soon as given observable completes.
        If that condition is satisfied before-hand, no pause occurs. */
        doWaitForCompleted<T>(observable:Rx.Observable<T>, message?:string):void;
        /** Enqueues into sequence a pause that will end as soon as given observable provides next value.
        If that condition is satisfied before-hand, no pause occurs. */
        doWaitForNext<T>(observable:Rx.Observable<T>, message?:string):void;
        /** nqueues into sequence a pause that will end as soon as given completable completes. (ILapse or ISequence)
        If that condition is satisfied before-hand, no pause occurs. */
        doWaitFor(completable:ICompletable, message?:string):void;
        /** Enqueues into sequence a group of actions that will be executed altogether in parallel.  Only after all
        actions in the group have completed will the sequence continue with the next action. */
        doParallel(action: (parallel:IParallel)=>void, message?:string):void;
        /** Enqueues into sequence an action that will dispose the given disposable. */
        doDispose(disposable:Rx.IDisposable, message?:string):void;
        /** Enqueues into sequence a group of actions that will be executed one by one */
        doSequence(action:(sequence:ISequence) => void, message?:string):void;
    }
}

/// <reference path="./ICompletable.ts"/>
/// <reference path="../../typings/rx.d.ts"/>

module Sequenx
{
    export interface ILapse extends ICompletable, Rx.IDisposable
    {
        sustain(name?: string): Rx.IDisposable;
        getChildLog(name: string): ILog;
        name: string;

        //extensions
        child(action: (lapse: ILapse) => void, message?: string): void;
        sequence(action: (seq: ISequence) => void, message?: string): Rx.IDisposable;
        onCompleted(action: () => void): Rx.IDisposable;
    }
}

/// <reference path="./ICompletable.ts"/>
/// <reference path="../../typings/rx.d.ts"/>

module Sequenx
{
    export interface ILapse extends ICompletable
    {
        sustain(): Rx.IDisposable;
    }
}

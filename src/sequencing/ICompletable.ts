/// <reference path="../../typings/rx.d.ts"/>

module Sequenx
{
    export interface ICompletable
    {
        completed: Rx.IObservable<any>;
    }
}

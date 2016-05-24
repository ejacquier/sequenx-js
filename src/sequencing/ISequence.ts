/// <reference path="./ICompletable.ts"/>
/// <reference path="./ILapse.ts"/>

module Sequenx
{
    export interface ISequence extends ICompletable
    {
        add(action: (lapse: ILapse) => void, message?: string): void;
        getChildLog(name:string):ILog;
    }
}

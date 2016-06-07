/// <reference path="./ICompletable.ts"/>
/// <reference path="./ILapse.ts"/>

module Sequenx
{
    export interface ISequence extends ICompletable
    {
        add(item: Item): void;
        skip(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        skipTo(predicate: (item: Item) => boolean, cancelCurrent: boolean): void;
        getChildLog(name: string): ILog;
    }
}

/// <reference path="./ICompletable.ts"/>
/// <reference path="./ILapse.ts"/>

module Sequenx
{
    export interface ISequence extends ICompletable
    {
        add(action: (lapse: ILapse) => void, lapseDescription: string, timer?: number): void;
        addParallel(action: (parallel: IParallel) => void, name:string): void;
        start(): void;
    }
}

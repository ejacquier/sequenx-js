/// <reference path="./ICompletable.ts"/>
/// <reference path="./ILapse.ts"/>

module Sequenx
{
    export interface ISequence extends ICompletable
    {
        add(action: (lapse: ILapse) => void, lapseDescription: string, timer?: number): void;
        start(): void;
}
}

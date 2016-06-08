/// <reference path="./Sequence.ts"/>
/// <reference path="../IParallel.ts"/>

module Sequenx
{
    export class Parallel extends Sequence implements IParallel
    {
        private _lapse: ILapse;

        constructor(lapse: ILapse)
        {
            super();
            this._lapse = lapse;
        }

        get completed(): Rx.Observable<any>
        {
            return this._lapse.completed;
        }

        set completed(value: Rx.Observable<any>) { }

        get name(): string
        {
            return this._lapse.name;
        }

        set name(value: string) { }

        public getChildLog(name: string): ILog
        {
            return this._lapse.getChildLog(name);
        }

        public add(item: Item): void
        {
            if (!(item instanceof Sequenx.Item))
            {
                this._log.error("Trying to add() something other than Sequenx.Item, use do if you use a function(lapse)");
                return;
            }
            
            this._lapse.child(item.action, item.message);
        }

        public skip(predicate: (item: Item) => boolean, cancelCurrent: boolean): void
        {
            throw new Error("skip not implemented for Parallel");
        }

        public skipTo(predicate: (item: Item) => boolean, cancelCurrent: boolean): void
        {
            throw new Error("skipTo not implemented for Parallel");
        }
    }
}

/// <reference path="./Sequence.ts"/>
/// <reference path="../IParallel.ts"/>

module Sequenx
{
    export class Parallel implements IParallel
    {
        private _lapse:Lapse;
        
        constructor(lapse:ILapse)
        {
            if (!(lapse instanceof Sequenx.Lapse))
                throw new Error("Parallel only support Sequenx.Lapse implementation!");
            
            this._lapse = lapse as Sequenx.Lapse;
        }
        
        get completed(): Rx.IObservable<any>
        {
            return this._lapse.completed;
        }

        set completed(value: Rx.IObservable<any>)
        {

        }
        
        public getChildLog(name:string):ILog
        {
            return this._lapse.getChildLog(name);
        }

        public add(item:Item): void
        {
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

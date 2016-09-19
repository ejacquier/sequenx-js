/// <reference path="./Sequence.ts"/>

module Sequenx
{
    export interface Parallel
    {

    }

    export class Parallel extends Sequence implements Parallel, ISequenceItem
    {
        message: string;

        constructor(nameOrLog?: string | ILog, autoStart = false)
        {
            super(nameOrLog, autoStart);
        }

        public scheduleNext(): void
        {
            let count = this._items.length;
            if (!count)
                return this._cbComplete && this._cbComplete();
            this._items.forEach(item => item
                .start(() => --count <= 0 && this._cbComplete && this._cbComplete()));
            this._items = [];
        }

        public skip(predicate: (item: ISequenceItem) => boolean): void
        {
            throw new Error("skip not implemented for Parallel");
        }

        public skipTo(predicate: (item: ISequenceItem) => boolean): void
        {
            throw new Error("skipTo not implemented for Parallel");
        }
    }
}

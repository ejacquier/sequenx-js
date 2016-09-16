module Sequenx
{
    export interface IDisposable
    {
        dispose(): void;
    }

    export class Disposable implements IDisposable
    {

        static empty: Disposable = new Disposable();
        static create(action: () => void): Disposable
        {
            return new Disposable(action);
        }
        private _isDisposed: boolean = false;

        constructor(public action?: () => void) { }

        get isDisposed()
        {
            return this._isDisposed;
        }

        dispose()
        {
            !this._isDisposed && this.action && this.action();
            this._isDisposed = true;
        }
    }

    export class RefCountDisposable extends Disposable
    {
        private _count: number = 0;
        private _self: IDisposable;

        constructor(private disposable: Disposable)
        {
            super(() => this._self.dispose());
            this._self = this.getDisposable();
        }

        getDisposable(): IDisposable
        {
            this._count++;
            return this.isDisposed ? Disposable.empty : Disposable.create(() =>
            {
                this._count--;
                if (this._count <= 0)
                    this.disposable.dispose();
            });
        }
    }
}
/// <reference path="../../../typings/rx.d.ts"/>

module Sequenx
{
    //Custom implementation of UniRx OperatorObservableBase and Sequenx.AutoDetachObservable
    //see https://github.com/neuecc/UniRx/blob/master/Assets/Plugins/UniRx/Scripts/Operators/OperatorObservableBase.cs
    export class AutoDetachObservable<T> implements Rx.IObservable<T>
    {
        private _source: Rx.IObservable<T>;
        
        constructor(source: Rx.IObservable<T>)
        {
            this._source = source;
        }
        
        public subscribe(observer:Rx.IObserver<T>):Rx.IDisposable
        {
            const singleDisposable = new Rx.SingleAssignmentDisposable();
            const disposable = this.subscribeCore(observer, singleDisposable);
            return singleDisposable;
        }
        
        private subscribeCore(observer:Rx.IObserver<T>, cancel:Rx.IDisposable):Rx.IDisposable
        {
            return this._source.subscribe(Rx.Observer.create<T>(observer, cancel ));
        }
    }
}
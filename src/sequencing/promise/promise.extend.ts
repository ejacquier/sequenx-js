module Sequenx
{
    export interface Sequence
    {
        doPromise(action: Promise<any> | (() => Promise<any>));
        startPromise(): Promise<any>;
    }

    Sequence.prototype.doPromise = function (action: Promise<any> | (() => Promise<any>))
    {
        if (action instanceof Promise)
            this.do(done => action.then(v => done()));
        else
            this.do(done => action().then(v => done()));
    };

    Sequence.prototype.startPromise = function ()
    {
        return new Promise(resolve => this.start(resolve));
    };
}
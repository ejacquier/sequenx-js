module Sequenx
{
    export interface ILog extends IDisposable
    {
        getChild(name: string): ILog;

        info(message: string, ...params: any[]): void
        warning(message: string, ...params: any[]): void
        error(message: string, ...params: any[]): void
        name: string;
    }
}
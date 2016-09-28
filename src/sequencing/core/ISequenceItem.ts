module Sequenx
{
    export interface ISequenceItem
    {
        message?: string;
        start(cb?: () => void);
    }
}
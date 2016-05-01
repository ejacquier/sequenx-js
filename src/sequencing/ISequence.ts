/// <reference path="./ICompletable.ts"/>
/// <reference path="./ILapse.ts"/>

module Sequenx
{
  export interface ISequence extends ICompletable
  {
    do(action: (lapse:ILapse) => void, ...params: any[]);
  }
}

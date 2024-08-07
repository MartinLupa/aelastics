/*
 * Project: aelastics-store
 * Created Date: Thursday November 3rd 2022
 * Author: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Last Modified: Saturday, 16th September 2023
 * Modified By: Sinisa Neskovic (https://github.com/Sinisa-Neskovic)
 * -----
 * Copyright (c) 2023 Aelastics (https://github.com/AelasticS)
 */

// Status of persistent objects
export enum StatusValue {
    Initializing,// 0- object is stil under creation/deserialization/hydration
    Unmodified, //  1-object is unchanged. but can be changed
    Created,    //  2- object is new, can be changed
    Updated,    //  3- object is modified
    Deleted     //  4- object is deleted
}


const statusOutcome: StatusValue [][] = [
    [StatusValue.Initializing, StatusValue.Initializing, StatusValue.Initializing, StatusValue.Initializing, StatusValue.Deleted],// old - initializing
    [StatusValue.Unmodified, StatusValue.Unmodified, StatusValue.Unmodified, StatusValue.Updated, StatusValue.Deleted],// unmodified
    [StatusValue.Initializing/*changed*/, StatusValue.Created, StatusValue.Created, StatusValue.Created, StatusValue.Deleted/*brisem objekat*/],// created
    [StatusValue.Updated, StatusValue.Updated, StatusValue.Updated, StatusValue.Updated, StatusValue.Deleted],// updated
    [StatusValue.Deleted, StatusValue.Deleted, StatusValue.Deleted, StatusValue.Deleted, StatusValue.Deleted]// deleted
];




export function setStatus(oldStatus: StatusValue, newStatus: StatusValue): StatusValue {
    if(oldStatus && newStatus)
        return statusOutcome[oldStatus][newStatus];
    else 
        return oldStatus
}

// Used by persistent objects to keep its status
export class Status {

    private _value: StatusValue = StatusValue.Unmodified;

    get value(): StatusValue {
        return this._value
    }

    constructor(initialStatus: StatusValue) {
        this._value = initialStatus;
    }

    public Initializing() {
        this._value = setStatus(this._value, StatusValue.Initializing);
    }

    public Initialazed() {
        this._value = setStatus(this._value, StatusValue.Unmodified);
    }


    public Created() {
        this._value = setStatus(this._value, StatusValue.Created);
    }

    public Updated() {
        this._value = setStatus(this._value, StatusValue.Updated);
    }

    public Deleted() {
        this._value = setStatus(this._value, StatusValue.Deleted);
    }
}


/* Example of usage

class Person {
    private _status:StatusValue;
    private _name:string;

   constructor(initStatus: StatusValue) {
        this._status = new Status(initStatus);
    }

    public get status(): StatusValue {
        return this._status.value
    }

    public set publicAttr(n: string) {
        this._name = n;
        this._status.Updated();
    }
}

 */


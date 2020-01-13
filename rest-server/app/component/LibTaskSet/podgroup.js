"use strict"


class PodGroup{
    constructor(){
        this._name = "";
        this._minMember = 0;
        this._namespace = "";
    }

    GetNamespace(){
        return this._namespace;
    }

    SetNamespace(space){
        this._namespace = space;
    }

    GetName(){
        return this._name;
    }

    SetName(name){
        this._name = name;
    }

    SetMinMember(min){
        this._minMember = min;
    }
    GetMinMember(){
        return this._minMember;
    }

    toJson(){
        return  {
            apiVersion:"scheduling.incubator.k8s.io/v1alpha1",
            kind:"PodGroup",
            metadata:{
                name:this.GetName()
            },
            spec:{
                minMember:this.GetMinMember(),
            },
        };
    }
}


module.exports = PodGroup;
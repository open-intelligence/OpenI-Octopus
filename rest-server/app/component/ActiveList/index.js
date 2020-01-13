const ActiveListMap = new Map();

function Node() {
    this.pre = null;
    this.next = null;
    this.store = null;
    this.created_time = 0;
}

Node.prototype.getPre = function() {
    return this.pre;
}

Node.prototype.setPre = function(pre) {
    this.pre = pre;
}

Node.prototype.setNext = function(next) {
    this.next = next;
}
Node.prototype.getNext = function() {
    return this.next;
}

Node.prototype.setStore = function(it) {
    this.store = it;
}

Node.prototype.getStore = function() {
    return this.store;
}

Node.prototype.setTime = function(now) {
    this.created_time = now;
}

Node.prototype.isExpired = function(now, timeout) {
    return now - this.created_time > timeout;
}

function ActiveList() {
    this.header = null;
    this.tail = null;

    this.num = 0;

    this.capacity = 5000;

    this.timeout = 1000 * 60 * 60;
}

ActiveList.prototype.getItem = function(func) {
    var now = Date.now();
    var start = this.header;
    var found = null;
    while (null != start) {
        if (func(start.getStore()) === true) {
            if (start.isExpired(now, this.timeout)) {
                var next = start.getNext();
                var pre = start.getPre();
                if (null != pre) {
                    pre.setNext(next);
                    if (null != next) {
                        next.setPre(pre);
                    } else {
                        this.tail = pre;
                    }
                } else {
                    this.header = next;
                    if (null != next) {
                        next.setPre(null);
                    }
                }
                start = next;
            } else {
                found = start.getStore();
                var pre = start.getPre();
                var next = start.getNext();
                start.setNext(pre);
                if (null != pre) {
                    pre.setNext(next);
                    if (null != next) {
                        next.setPre(pre);
                    } else {
                        this.tail = pre;
                    }
                    var pre_pre = pre.getPre();
                    if (null != pre_pre) {
                        pre_pre.setNext(start);
                        start.setPre(pre_pre);
                    } else {
                        this.header = start;
                        start.setPre(null);
                    }
                } else {
                    this.header = start;
                    start.setPre(null);
                    start.setNext(next);
                    if (null == next) {
                        this.tail = start;
                    }
                }
                break;
            }
        } else {
            start = start.getNext();
        }
    }

    return found;
}

ActiveList.prototype.setItem = function(item){
    var node = new Node();
    node.setTime(Date.now());
    node.setStore(item);
    this.num +=1;
    var current = this.header;
    if(null != current){
        current.setPre(node);
        node.setNext(current);
        this.header = node;
    }else{
        this.header = node;
        this.tail = node;
    }

    if( this.num > this.capacity){
        var tail = this.tail;
        if( null != this.tail){
            this.num -=1;
            var pre = tail.getPre();
            this.tail = pre;
            if(null != pre){
                pre.setNext(null);
            }
        }
    }
}

ActiveList.prototype.setMaxCacheTime = function(timeout){
    this.timeout = timeout;
}

ActiveList.prototype.setCapacity = function(cap){
    this.capacity = cap;
}

function getActiveList(namespace){
    if(!namespace){
        return
    }
    let activeList = ActiveListMap.get(namespace);
    if(!activeList){
        activeList = new ActiveList();
        ActiveListMap.set(namespace,activeList);
    }
    return activeList;
}


module.exports = {
    getActiveList
};
 
package types

import (
	"sync"
)

type ThreadSafeMap struct{
	lock  sync.RWMutex 
	store map[string] interface{}
}


func (t *ThreadSafeMap) Set(key string,value interface{}){
	t.lock.Lock()
	defer t.lock.Unlock()
	t.store[key] = value
}

func (t *ThreadSafeMap)Get(key string)(value interface{},exists bool){
	t.lock.RLock()
	defer t.lock.RUnlock()
	value,exists = t.store[key]
	return 
}

func (t *ThreadSafeMap)Delete(key string){
	t.lock.Lock()
	defer t.lock.Unlock()
    if _,exists:= t.store[key];exists{
		delete(t.store,key)
	}	
}

func (t *ThreadSafeMap)List()(list []interface{}){
	t.lock.RLock();
	defer t.lock.RUnlock()
	for _,value := range t.store{
		list = append(list,value)
	}
	return
}

func NewThreadSafeMap()*ThreadSafeMap{
	safe_map:= new(ThreadSafeMap)
	safe_map.store = make(map[string]interface{})
	return safe_map
}